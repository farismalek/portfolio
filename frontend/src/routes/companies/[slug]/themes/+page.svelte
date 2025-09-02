<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { getCompany, updateCompany } from "$lib/services/companyService";
  import { themeStore } from "$lib/stores/themeStore";
  import Button from "$lib/components/common/Button.svelte";
  import PageHeader from "$lib/components/common/PageHeader.svelte";
  import CompanyThemeCustomizer from "$lib/components/company/CompanyThemeCustomizer.svelte";
  import Card from "$lib/components/common/Card.svelte";
  import LoadingSpinner from "$lib/components/common/LoadingSpinner.svelte";
  import AlertBox from "$lib/components/common/AlertBox.svelte";

  // Get company slug from URL
  $: slug = $page.params.slug;

  let company = null;
  let isLoading = true;
  let error = null;
  let success = "";
  let brandColors = {
    primary: "#0ea5e9", // Default blue
    secondary: "#8b5cf6", // Default purple
    accent: "#f59e0b", // Default amber
  };
  let useCompanyTheme = false;

  // Load company data
  onMount(async () => {
    try {
      isLoading = true;

      // Get company details
      company = await getCompany(slug);

      // Load saved brand colors if available
      if (company.brandSettings?.colors) {
        brandColors = {
          primary: company.brandSettings.colors.primary || brandColors.primary,
          secondary:
            company.brandSettings.colors.secondary || brandColors.secondary,
          accent: company.brandSettings.colors.accent || brandColors.accent,
        };
      }

      // Check if company theme is active
      useCompanyTheme = !!company.brandSettings?.useCustomTheme;
    } catch (err) {
      error = err.message || "Failed to load company";
      console.error(err);
    } finally {
      isLoading = false;
    }
  });

  // Handle theme save
  async function handleThemeSave(event) {
    try {
      const { brandColors, useCompanyTheme, themes } = event.detail;

      // Update company in the API
      await updateCompany(company.id, {
        brandSettings: {
          colors: brandColors,
          useCustomTheme: useCompanyTheme,
          themes: themes,
        },
      });

      // Update local company data
      company = {
        ...company,
        brandSettings: {
          ...company.brandSettings,
          colors: brandColors,
          useCustomTheme: useCompanyTheme,
          themes: themes,
        },
      };

      // Show success message
      success = "Company brand theme saved successfully";
      setTimeout(() => {
        success = "";
      }, 3000);
    } catch (err) {
      error = err.message || "Failed to save company theme";
      console.error(err);
    }
  }
</script>

<svelte:head>
  <title
    >{isLoading
      ? "Loading..."
      : company
        ? `${company.name} - Brand Themes`
        : "Company Not Found"} | Portfolia</title
  >
</svelte:head>

<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  {#if isLoading}
    <div class="flex justify-center py-16">
      <LoadingSpinner />
    </div>
  {:else if error}
    <Card>
      <div class="text-center py-8">
        <div
          class="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-red-100 rounded-full"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-8 w-8 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 class="text-xl font-medium mb-2">Failed to Load Company</h2>
        <p class="text-neutral-600 mb-6">{error}</p>
        <Button href="/companies" variant="primary">Go Back to Companies</Button
        >
      </div>
    </Card>
  {:else if company}
    <!-- Back button -->
    <div class="mb-6">
      <Button href={`/companies/${slug}`} variant="ghost" size="sm">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        Back to Company Profile
      </Button>
    </div>

    <PageHeader
      title="Company Brand & Theme"
      description={`Customize the brand appearance for ${company.name}`}
    />

    {#if success}
      <div class="mb-6">
        <AlertBox type="success" dismissible bind:visible={success}>
          {success}
        </AlertBox>
      </div>
    {/if}

    <div class="space-y-6">
      <!-- Brand Theme Customizer -->
      <CompanyThemeCustomizer
        {company}
        bind:brandColors
        bind:useCompanyTheme
        on:save={handleThemeSave}
      />

      <!-- Theme Preview Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Light Theme Preview -->
        <Card class="overflow-hidden">
          <div
            class="h-40 flex items-center justify-center"
            style="background: linear-gradient(to right, {brandColors.primary}, {brandColors.secondary})"
          >
            <div class="bg-white p-6 rounded-lg shadow-lg">
              <div
                class="text-xl font-bold"
                style="color: {brandColors.primary}"
              >
                {company.name}
              </div>
              <div class="text-sm text-neutral-600">Light Theme Preview</div>
            </div>
          </div>
          <div class="p-4">
            <h3 class="font-medium">Light Brand Theme</h3>
            <p class="text-sm text-neutral-600">
              Preview of your company's light theme
            </p>
          </div>
        </Card>

        <!-- Dark Theme Preview -->
        <Card class="overflow-hidden">
          <div
            class="h-40 flex items-center justify-center bg-neutral-900"
            style="background: linear-gradient(to right, {brandColors.primary}, {brandColors.secondary})"
          >
            <div class="bg-neutral-800 p-6 rounded-lg shadow-lg">
              <div
                class="text-xl font-bold"
                style="color: {brandColors.primary}"
              >
                {company.name}
              </div>
              <div class="text-sm text-neutral-400">Dark Theme Preview</div>
            </div>
          </div>
          <div class="p-4">
            <h3 class="font-medium">Dark Brand Theme</h3>
            <p class="text-sm text-neutral-600">
              Preview of your company's dark theme
            </p>
          </div>
        </Card>
      </div>

      <!-- Theme Usage Guidelines -->
      <Card>
        <div class="p-6">
          <h3 class="text-lg font-medium mb-4">Brand Theme Usage</h3>
          <p class="mb-4">When enabled, your brand theme will be applied to:</p>
          <ul
            class="list-disc list-inside space-y-2 text-neutral-700 dark:text-neutral-300"
          >
            <li>Company profile pages</li>
            <li>Job listings published by your company</li>
            <li>Project pages and proposals</li>
            <li>Messaging and collaboration spaces</li>
            <li>Custom portfolio showcase pages</li>
          </ul>
          <div class="mt-6 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
            <div class="flex items-start">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 mr-2 text-neutral-500 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p class="text-sm">
                  <strong>Note:</strong> Custom themes will only apply to your company's
                  spaces within Portfolia. Users viewing your pages will still see
                  your branding, but within their selected theme's overall structure.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  {/if}
</div>
