<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { addPaymentMethod } from "$lib/services/subscriptionService";
  import Card from "$lib/components/common/Card.svelte";
  import TextField from "$lib/components/common/TextField.svelte";
  import Button from "$lib/components/common/Button.svelte";
  import LoadingSpinner from "$lib/components/common/LoadingSpinner.svelte";

  // Card details
  let cardNumber = "";
  let expiryMonth = "";
  let expiryYear = "";
  let cvv = "";
  let cardholderName = "";

  // Form state
  let loading = false;
  let error: string | null = null;

  // Validation state
  let errors = {
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
    cardholderName: "",
  };

  const dispatch = createEventDispatcher();

  // Format card number as user types
  function formatCardNumber(e: Event) {
    const input = e.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, "");
    let formattedValue = "";

    for (let i = 0; i < value.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formattedValue += " ";
      }
      formattedValue += value[i];
    }

    cardNumber = formattedValue;
  }

  // Format expiry date as user types
  function formatExpiryMonth(e: Event) {
    const input = e.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, "");

    // Limit to 2 digits
    if (value.length > 2) {
      value = value.slice(0, 2);
    }

    // Ensure month is valid (1-12)
    if (value.length === 2) {
      const month = parseInt(value);
      if (month < 1) value = "01";
      if (month > 12) value = "12";
    }

    expiryMonth = value;
  }

  function formatExpiryYear(e: Event) {
    const input = e.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, "");

    // Limit to 2 digits (assuming 2-digit year)
    if (value.length > 2) {
      value = value.slice(0, 2);
    }

    expiryYear = value;
  }

  // Format CVV as user types
  function formatCVV(e: Event) {
    const input = e.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, "");

    // Limit to 3-4 digits
    if (value.length > 4) {
      value = value.slice(0, 4);
    }

    cvv = value;
  }

  // Validate form before submission
  function validateForm(): boolean {
    let isValid = true;

    // Reset errors
    errors = {
      cardNumber: "",
      expiryMonth: "",
      expiryYear: "",
      cvv: "",
      cardholderName: "",
    };

    // Validate card number (simple validation, just checking length)
    const strippedCardNumber = cardNumber.replace(/\s/g, "");
    if (!strippedCardNumber) {
      errors.cardNumber = "Card number is required";
      isValid = false;
    } else if (
      strippedCardNumber.length < 15 ||
      strippedCardNumber.length > 16
    ) {
      errors.cardNumber = "Card number should be 15-16 digits";
      isValid = false;
    }

    // Validate expiry date
    if (!expiryMonth) {
      errors.expiryMonth = "Month is required";
      isValid = false;
    }

    if (!expiryYear) {
      errors.expiryYear = "Year is required";
      isValid = false;
    } else {
      // Check if card is expired
      const currentYear = new Date().getFullYear() % 100; // Get last 2 digits
      const currentMonth = new Date().getMonth() + 1; // 1-12

      const enteredYear = parseInt(expiryYear);
      const enteredMonth = parseInt(expiryMonth);

      if (
        enteredYear < currentYear ||
        (enteredYear === currentYear && enteredMonth < currentMonth)
      ) {
        errors.expiryYear = "Card is expired";
        isValid = false;
      }
    }

    // Validate CVV
    if (!cvv) {
      errors.cvv = "CVV is required";
      isValid = false;
    } else if (cvv.length < 3) {
      errors.cvv = "CVV should be 3-4 digits";
      isValid = false;
    }

    // Validate cardholder name
    if (!cardholderName.trim()) {
      errors.cardholderName = "Cardholder name is required";
      isValid = false;
    }

    return isValid;
  }

  // Submit form and add payment method
  async function handleSubmit() {
    if (!validateForm()) {
      return;
    }

    loading = true;
    error = null;

    try {
      // In a real application, you'd use a secure payment processor like Stripe
      // This is a simplified example to simulate the flow

      // Simulate payment token creation (in a real app, this would be done by a payment SDK)
      const paymentToken = btoa(
        `${cardNumber.replace(/\s/g, "")}-${expiryMonth}${expiryYear}-${cvv}`,
      );

      // Add the payment method to the user's account
      const paymentMethod = await addPaymentMethod(paymentToken);

      // Emit success event with the new payment method ID
      dispatch("success", { paymentMethodId: paymentMethod.id });
    } catch (err) {
      error = err.message || "Failed to add payment method";
    } finally {
      loading = false;
    }
  }

  // Cancel form
  function handleCancel() {
    dispatch("cancel");
  }

  // Detect card type based on number
  $: cardType = detectCardType(cardNumber);

  function detectCardType(number: string): string {
    const strippedNumber = number.replace(/\s/g, "");

    if (strippedNumber.startsWith("4")) return "visa";
    if (/^5[1-5]/.test(strippedNumber)) return "mastercard";
    if (/^3[47]/.test(strippedNumber)) return "amex";
    if (/^6(?:011|5)/.test(strippedNumber)) return "discover";

    return "unknown";
  }
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-4">
  {#if error}
    <div
      class="p-3 bg-danger-50 dark:bg-danger-900 text-danger-800 dark:text-danger-200 rounded-md text-sm"
    >
      {error}
    </div>
  {/if}

  <div class="space-y-4">
    <TextField
      label="Cardholder Name"
      bind:value={cardholderName}
      placeholder="Name on card"
      error={errors.cardholderName}
      required
    />

    <div class="relative">
      <TextField
        label="Card Number"
        bind:value={cardNumber}
        placeholder="1234 5678 9012 3456"
        on:input={formatCardNumber}
        error={errors.cardNumber}
        required
      />

      {#if cardType !== "unknown"}
        <div class="absolute right-3 top-9">
          <span class="text-sm text-neutral-500">
            {#if cardType === "visa"}
              <span class="font-medium">Visa</span>
            {:else if cardType === "mastercard"}
              <span class="font-medium">Mastercard</span>
            {:else if cardType === "amex"}
              <span class="font-medium">Amex</span>
            {:else if cardType === "discover"}
              <span class="font-medium">Discover</span>
            {/if}
          </span>
        </div>
      {/if}
    </div>

    <div class="grid grid-cols-3 gap-4">
      <div>
        <TextField
          label="Month"
          bind:value={expiryMonth}
          placeholder="MM"
          on:input={formatExpiryMonth}
          error={errors.expiryMonth}
          required
        />
      </div>

      <div>
        <TextField
          label="Year"
          bind:value={expiryYear}
          placeholder="YY"
          on:input={formatExpiryYear}
          error={errors.expiryYear}
          required
        />
      </div>

      <div>
        <TextField
          label="CVV"
          bind:value={cvv}
          placeholder="123"
          type="password"
          on:input={formatCVV}
          error={errors.cvv}
          required
        />
      </div>
    </div>
  </div>

  <div class="flex justify-end space-x-3 pt-3">
    <Button type="button" variant="ghost" on:click={handleCancel}>
      Cancel
    </Button>

    <Button type="submit" variant="primary" disabled={loading}>
      {#if loading}
        <LoadingSpinner size="sm" class="mr-2" />
        Adding...
      {:else}
        Add Payment Method
      {/if}
    </Button>
  </div>
</form>
