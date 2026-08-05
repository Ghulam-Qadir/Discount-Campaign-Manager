const CREATE_BASIC = `#graphql
  mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
    discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
      codeDiscountNode {
        id
        codeDiscount {
          ... on DiscountCodeBasic {
            codes(first: 10) {
              nodes {
                code
              }
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }`;

const CREATE_FREE_SHIPPING = `#graphql
  mutation discountCodeFreeShippingCreate($freeShippingCodeDiscount: DiscountCodeFreeShippingInput!) {
    discountCodeFreeShippingCreate(freeShippingCodeDiscount: $freeShippingCodeDiscount) {
      codeDiscountNode {
        id
        codeDiscount {
          ... on DiscountCodeFreeShipping {
            codes(first: 10) {
              nodes {
                code
              }
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }`;

const CREATE_BXGY = `#graphql
  mutation discountCodeBxgyCreate($bxgyCodeDiscount: DiscountCodeBxgyInput!) {
    discountCodeBxgyCreate(bxgyCodeDiscount: $bxgyCodeDiscount) {
      codeDiscountNode {
        id
        codeDiscount {
          ... on DiscountCodeBxgy {
            codes(first: 10) {
              nodes {
                code
              }
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }`;

const DELETE_DISCOUNT = `#graphql
  mutation discountCodeDelete($id: ID!) {
    discountCodeDelete(id: $id) {
      deletedCodeDiscountId
      userErrors {
        field
        message
      }
    }
  }`;

const CUSTOMERS_BY_TAG = `#graphql
  query CustomersByTag($first: Int!, $query: String!, $cursor: String) {
    customers(first: $first, query: $query, after: $cursor) {
      edges {
        node {
          id
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }`;

const MAX_CUSTOMER_FETCH = 5000;

function itemsInput(appliesTo, productIds, collectionIds) {
  if (appliesTo === "products") {
    return { products: { productsToAdd: productIds } };
  }
  if (appliesTo === "collections") {
    return { collections: { collectionsToAdd: collectionIds } };
  }
  return { all: true };
}

async function customerSelectionInput(admin, eligibility, customerTags) {
  if (eligibility === "all") {
    return { all: true };
  }

  const tag = eligibility === "vip" ? "VIP" : customerTags;
  const ids = [];
  let cursor = null;
  while (ids.length < MAX_CUSTOMER_FETCH) {
    const response = await admin.graphql(CUSTOMERS_BY_TAG, {
      variables: {
        first: 250,
        query: `tag:${tag}`,
        cursor,
      },
    });
    const json = await response.json();
    const data = json.data?.customers;
    if (!data) break;
    for (const edge of data.edges) {
      ids.push(edge.node.id);
    }
    if (!data.pageInfo.hasNextPage || ids.length >= MAX_CUSTOMER_FETCH) break;
    cursor = data.pageInfo.endCursor;
  }

  if (ids.length === 0) {
    return { all: true };
  }
  return { customers: { customersToAdd: ids } };
}

function baseFields(campaign) {
  return {
    title: campaign.name,
    code: campaign.couponCode,
    startsAt: campaign.startDate
      ? new Date(campaign.startDate).toISOString()
      : new Date().toISOString(),
    endsAt: campaign.endDate ? new Date(campaign.endDate).toISOString() : undefined,
    usageLimit: campaign.usageLimit && campaign.usageLimit > 0 ? campaign.usageLimit : undefined,
  };
}

function throwUserErrors(mutation, userErrors = []) {
  if (userErrors.length === 0) return;
  const messages = userErrors
    .map((e) => (e.field ? `${e.field}: ${e.message}` : e.message))
    .join("; ");
  throw new Error(`Failed to create discount (${mutation}): ${messages}`);
}

export async function createDiscount(admin, campaign) {
  const customerSelection = await customerSelectionInput(
    admin,
    campaign.customerEligibility,
    campaign.customerTags,
  );

  const productIds = campaign.products.map((p) => p.productId);
  const collectionIds = campaign.collections.map((c) => c.collectionId);

  let query = CREATE_BASIC;
  let variableName = "basicCodeDiscount";
  let variables = null;

  switch (campaign.type) {
    case "PERCENTAGE": {
      variables = {
        [variableName]: {
          ...baseFields(campaign),
          customerGets: {
            items: itemsInput(campaign.appliesTo, productIds, collectionIds),
            value: { percentage: Number(campaign.value) / 100 },
          },
          customerSelection,
        },
      };
      break;
    }
    case "FIXED_AMOUNT": {
      variables = {
        [variableName]: {
          ...baseFields(campaign),
          customerGets: {
            items: itemsInput(campaign.appliesTo, productIds, collectionIds),
            value: {
              discountAmount: {
                amount: Number(campaign.value).toFixed(2),
                appliesOnEachItem: false,
              },
            },
          },
          customerSelection,
        },
      };
      break;
    }
    case "FREE_SHIPPING": {
      query = CREATE_FREE_SHIPPING;
      variableName = "freeShippingCodeDiscount";
      variables = {
        [variableName]: {
          ...baseFields(campaign),
          appliesOnOneTimePurchase: true,
          appliesOnSubscription: true,
          destination: { all: true },
          customerSelection,
        },
      };
      break;
    }
    case "BOGO": {
      query = CREATE_BXGY;
      variableName = "bxgyCodeDiscount";
      variables = {
        [variableName]: {
          ...baseFields(campaign),
          customerBuys: {
            items: itemsInput(campaign.appliesTo, productIds, collectionIds),
            value: { quantity: "1" },
          },
          customerGets: {
            items: itemsInput(campaign.appliesTo, productIds, collectionIds),
            value: {
              discountOnQuantity: {
                effect: { percentage: Number(campaign.value) / 100 },
                quantity: "1",
              },
            },
          },
          customerSelection,
        },
      };
      break;
    }
    default:
      throw new Error(`Unsupported campaign type: ${campaign.type}`);
  }

  const response = await admin.graphql(query, { variables });
  const json = await response.json();

  const resultKey = `discountCode${mutationName(campaign.type)}Create`;
  const result = json.data?.[resultKey];

  const userErrors = result?.userErrors ?? [];
  if (userErrors.length > 0) {
    throwUserErrors(mutationName(campaign.type), userErrors);
  }

  const node = result?.codeDiscountNode;
  const codes = node?.codeDiscount?.codes?.nodes ?? [];
  return {
    discountId: node?.id ?? null,
    couponCode: codes[0]?.code ?? campaign.couponCode,
  };
}

function mutationName(type) {
  switch (type) {
    case "PERCENTAGE":
    case "FIXED_AMOUNT":
      return "Basic";
    case "FREE_SHIPPING":
      return "FreeShipping";
    case "BOGO":
      return "Bxgy";
    default:
      return "Basic";
  }
}

export async function deleteDiscount(admin, discountId) {
  if (!discountId) return;
  const response = await admin.graphql(DELETE_DISCOUNT, {
    variables: { id: discountId },
  });
  const json = await response.json();
  const userErrors =
    json.data?.discountCodeDelete?.userErrors ?? [];
  if (userErrors.length > 0) {
    throw new Error(
      `Failed to delete discount: ${userErrors.map((e) => e.message).join("; ")}`,
    );
  }
}
