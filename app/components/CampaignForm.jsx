import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import PropTypes from "prop-types";
import {
  CAMPAIGN_TYPES,
  APPLIES_TO_OPTIONS,
  ELIGIBILITY_OPTIONS,
} from "../utils/constants";
import { previewCouponCode, toIsoDate } from "../utils/format";
import ResourceSelector from "./ResourceSelector";
import DCMButton from "./DCMButton";

function toDateInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export default function CampaignForm({
  campaign,
  productTitles,
  collectionTitles,
  currency,
  isUpdate = false,
  onSuccess,
}) {
  const fetcher = useFetcher();
  const errors = fetcher.data?.errors ?? null;
  const shopifyError = fetcher.data?.shopifyError ?? null;
  const [name, setName] = useState(campaign?.name ?? "");
  const [type, setType] = useState(campaign?.type ?? "PERCENTAGE");
  const [value, setValue] = useState(campaign?.value?.toString() ?? "");
  const [appliesTo, setAppliesTo] = useState(campaign?.appliesTo ?? "entire_order");
  const [productIds, setProductIds] = useState(
    (campaign?.products ?? []).map((p) => ({
      id: p.productId,
      title: productTitles?.[p.productId] ?? p.productId,
    })),
  );
  const [collectionIds, setCollectionIds] = useState(
    (campaign?.collections ?? []).map((c) => ({
      id: c.collectionId,
      title: collectionTitles?.[c.collectionId] ?? c.collectionId,
    })),
  );
  const [customerEligibility, setCustomerEligibility] = useState(
    campaign?.customerEligibility ?? "all",
  );
  const [customerTags, setCustomerTags] = useState(campaign?.customerTags ?? "");
  const [usageLimit, setUsageLimit] = useState(campaign?.usageLimit?.toString() ?? "");
  const [startDate, setStartDate] = useState(toDateInputValue(campaign?.startDate));
  const [endDate, setEndDate] = useState(toDateInputValue(campaign?.endDate));
  const [status, setStatus] = useState(
    campaign?.status === "ACTIVE" ? "ACTIVE" : campaign?.status ?? "DRAFT",
  );

  const isPercentageLike = type === "PERCENTAGE" || type === "BOGO";
  const isFreeShipping = type === "FREE_SHIPPING";
  const suffix = isPercentageLike
    ? "%"
    : isFreeShipping
      ? ""
      : currency ?? "";
  const valueLabel = isFreeShipping
    ? "Value"
    : isPercentageLike
      ? "Discount value"
      : "Discount amount";

  const submit = () => {
    const formData = new FormData();
    formData.set("intent", isUpdate ? "save" : "create");
    formData.set("name", name);
    formData.set("type", type);
    formData.set("value", value);
    formData.set("appliesTo", appliesTo);
    formData.set("customerEligibility", customerEligibility);
    formData.set("customerTags", customerTags);
    formData.set("usageLimit", usageLimit);
    formData.set("startDate", toIsoDate(`${startDate}T00:00:00`) ?? "");
    formData.set("endDate", toIsoDate(`${endDate}T00:00:00`) ?? "");
    formData.set("status", isUpdate ? status : "DRAFT");
    for (const item of productIds) formData.append("productIds", item.id);
    for (const item of collectionIds) formData.append("collectionIds", item.id);
    fetcher.submit(formData, { method: "post" });
  };

  const isSubmitting = fetcher.state !== "idle";

  useEffect(() => {
    if (onSuccess && fetcher.data?.campaign) {
      onSuccess(fetcher.data.campaign);
    }
  }, [fetcher.data, onSuccess]);

  return (
    <s-stack direction="block" gap="base">
      {shopifyError && (
        <s-banner tone="critical" heading="Shopify could not be updated">
          {shopifyError}
        </s-banner>
      )}

      {errors && Object.keys(errors).length > 0 && (
        <s-banner tone="critical" heading="Please fix the following">
          <s-unordered-list>
            {Object.values(errors).map((message) => (
              <s-list-item key={message}>{message}</s-list-item>
            ))}
          </s-unordered-list>
        </s-banner>
      )}

      <s-section heading="Details">
        <s-stack direction="block" gap="base">
          <s-text-field
            label="Campaign name"
            value={name}
            onInput={(event) => setName(event.currentTarget.value)}
            error={errors?.name}
            required
            placeholder="e.g. Summer Sale 20%"
            details={`A discount code is generated from the name, e.g. ${previewCouponCode(name)}`}
          />

          <s-select
            label="Campaign type"
            value={type}
            onInput={(event) => setType(event.currentTarget.value)}
            error={errors?.type}
          >
            {Object.entries(CAMPAIGN_TYPES).map(([campaignType, config]) => (
              <s-option key={campaignType} value={campaignType}>
                {config.label}
              </s-option>
            ))}
          </s-select>

          {!isFreeShipping && (
            <s-number-field
              label={valueLabel}
              value={value}
              suffix={suffix}
              min={0}
              max={isPercentageLike ? 100 : undefined}
              step={isPercentageLike ? 1 : 0.01}
              controls="stepper"
              onInput={(event) => setValue(event.currentTarget.value)}
              error={errors?.value}
              required
            />
          )}
        </s-stack>
      </s-section>

      <s-section heading="Targeting">
        <s-stack direction="block" gap="base">
          <s-choice-list
            label="Applies to"
            values={[appliesTo]}
            onInput={(event) => setAppliesTo(event.currentTarget.values[0])}
            error={errors?.appliesTo}
            variant="list"
          >
            {APPLIES_TO_OPTIONS.map((option) => (
              <s-choice key={option.value} value={option.value}>
                {option.label}
              </s-choice>
            ))}
          </s-choice-list>

          {appliesTo === "products" && (
            <ResourceSelector
              type="product"
              selection={productIds}
              onSelectionChange={setProductIds}
            />
          )}
          {errors?.productIds ? (
            <s-text tone="critical">{errors.productIds}</s-text>
          ) : null}

          {appliesTo === "collections" && (
            <ResourceSelector
              type="collection"
              selection={collectionIds}
              onSelectionChange={setCollectionIds}
            />
          )}
          {errors?.collectionIds ? (
            <s-text tone="critical">{errors.collectionIds}</s-text>
          ) : null}

          <s-choice-list
            label="Customer eligibility"
            values={[customerEligibility]}
            onInput={(event) => setCustomerEligibility(event.currentTarget.values[0])}
            error={errors?.customerEligibility}
            variant="list"
          >
            {ELIGIBILITY_OPTIONS.map((option) => (
              <s-choice key={option.value} value={option.value}>
                {option.label}
              </s-choice>
            ))}
          </s-choice-list>

          {customerEligibility === "tagged" && (
            <s-text-field
              label="Customer tags (comma separated)"
              value={customerTags}
              onInput={(event) => setCustomerTags(event.currentTarget.value)}
              error={errors?.customerTags}
              placeholder="vip, spring-sale"
            />
          )}
        </s-stack>
      </s-section>

      <s-section heading="Schedule & limits">
        <s-stack direction="block" gap="base">
          <s-stack direction="inline" gap="base">
            <s-date-field
              label="Start date"
              value={startDate}
              onInput={(event) => setStartDate(event.currentTarget.value)}
              error={errors?.startDate}
            />
            <s-date-field
              label="End date"
              value={endDate}
              onInput={(event) => setEndDate(event.currentTarget.value)}
              error={errors?.endDate}
            />
          </s-stack>

          <s-number-field
            label="Usage limit (blank = unlimited)"
            value={usageLimit}
            min={0}
            step={1}
            onInput={(event) => setUsageLimit(event.currentTarget.value)}
            error={errors?.usageLimit}
          />

          {isUpdate && (
            <s-select
              label="Status"
              value={status}
              onInput={(event) => setStatus(event.currentTarget.value)}
              error={errors?.status}
              details="Draft stores the campaign locally. Scheduled activates it on the start date. Active publishes it to Shopify immediately."
            >
              <s-option value="DRAFT">Draft</s-option>
              <s-option value="SCHEDULED">Schedule</s-option>
              <s-option value="ACTIVE">Publish now</s-option>
            </s-select>
          )}
        </s-stack>
      </s-section>

      <DCMButton variant="primary" size="lg" onClick={submit} loading={isSubmitting}>
        {isUpdate ? "Save changes" : "Create draft"}
      </DCMButton>
    </s-stack>
  );
}

CampaignForm.propTypes = {
  campaign: PropTypes.shape({
    name: PropTypes.string,
    type: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    appliesTo: PropTypes.string,
    products: PropTypes.arrayOf(
      PropTypes.shape({ productId: PropTypes.string }),
    ),
    collections: PropTypes.arrayOf(
      PropTypes.shape({ collectionId: PropTypes.string }),
    ),
    customerEligibility: PropTypes.string,
    customerTags: PropTypes.string,
    usageLimit: PropTypes.number,
    startDate: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(Date),
    ]),
    endDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    status: PropTypes.string,
  }),
  productTitles: PropTypes.object,
  collectionTitles: PropTypes.object,
  currency: PropTypes.string,
  isUpdate: PropTypes.bool,
  onSuccess: PropTypes.func,
};
