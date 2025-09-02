<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { createProduct, uploadProductPreview, uploadProductFile } from '$lib/services/creatorService';
  import type { CreatorProduct } from '$lib/types/creator';
  import { fetchProductCategories } from '$lib/services/marketplaceService';
  import type { ProductCategory } from '$lib/types/marketplace';
  import PageHeader from '$lib/components/common/PageHeader.svelte';
  import Card from '$lib/components/common/Card.svelte';
  import Button from '$lib/components/common/Button.svelte';
  import TextField from '$lib/components/common/TextField.svelte';
  import TextAreaField from '$lib/components/common/TextAreaField.svelte';
  import Select from '$lib/components/common/Select.svelte';
  import Checkbox from '$lib/components/common/Checkbox.svelte';
  import TagInput from '$lib/components/common/TagInput.svelte';
  import LoadingSpinner from '$lib/components/common/LoadingSpinner.svelte';
  import AlertBox from '$lib/components/common/AlertBox.svelte';
  import FileUpload from '$lib/components/common/FileUpload.svelte';
  import Tabs from '$lib/components/common/Tabs.svelte';
  
  let loading = true;
  let savingProduct = false;
  let error: string | null = null;
  let success = false;
  let categories: ProductCategory[] = [];
  let activeTab = 'basic';
  
  // Product form data
  let product: Partial<CreatorProduct> = {
    name: '',
    slug: '',
    description: '',
    shortDescription: '',
    price: 0,
    discountPrice: 0,
    currency: 'USD',
    categoryId: '',
    tags: [],
    previewImages: [],
    features: [],
    specifications: {},
    isPublished: false
  };
  
  // File uploads
  let previewFiles: File[] = [];
  let productFile: File | null = null;
  
  // Feature input
  let newFeature = '';
  
  // Specification inputs
  let specKey = '';
  let specValue = '';
  
  onMount(async () => {
    try {
      // Fetch product categories
      categories = await fetchProductCategories();
      
      if (categories.length > 0) {
        product.categoryId = categories[0].id;
      }
      
      loading = false;
    } catch (err) {
      error = err.message || 'Failed to load categories';
      loading = false;
    }
  });
  
  // Generate slug from product name
  function generateSlug() {
    if (product.name) {
      product.slug = product.name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
    }
  }
  
  // Handle preview image upload
  async function handlePreviewUpload(event: CustomEvent) {
    const files = event.detail.files;
    previewFiles = [...previewFiles, ...files];
  }
  
  // Handle product file upload
  function handleProductFileUpload(event: CustomEvent) {
    productFile = event.detail.files[0];
  }
  
  // Add feature
  function addFeature() {
    if (newFeature.trim()) {
      product.features = [...(product.features || []), newFeature.trim()];
      newFeature = '';
    }
  }
  
  // Remove feature
  function removeFeature(index: number) {
    product.features = product.features?.filter((_, i) => i !== index) || [];
  }
  
  // Add specification
  function addSpecification() {
    if (specKey.trim() && specValue.trim()) {
      product.specifications = {
        ...(product.specifications || {}),
        [specKey.trim()]: specValue.trim()
      };
      specKey = '';
      specValue = '';
    }
  }
  
  // Remove specification
  function removeSpecification(key: string) {
    if (product.specifications) {
      const { [key]: _, ...rest } = product.specifications;
      product.specifications = rest;
    }
  }
  
  // Format file size
  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    else return (bytes / 1073741824).toFixed(1) + ' GB';
  }
  
  // Save product
  async function saveProduct() {
    if (!validateForm()) {
      return;
    }
    
    savingProduct = true;
    error = null;
    
    try {
      // Create the product first
      const newProduct = await createProduct(product);
      
      // Upload preview images if any
      if (previewFiles.length > 0) {
        for (const file of previewFiles) {
          await uploadProductPreview(newProduct.id, file);
        }
      }
      
      // Upload product file if any
      if (productFile) {
        await uploadProductFile(newProduct.id, productFile);
      }
      
      success = true;
      
      // Redirect to product list after a short delay
      setTimeout(() => {
        goto('/creators/products');
      }, 2000);
    } catch (err) {
      error = err.message || 'Failed to create product';
      savingProduct = false;
    }
  }
  
  // Validate form before submission
  function validateForm(): boolean {
    if (!product.name) {
      error = 'Product name is required';
      return false;
    }
    
    if (!product.slug) {
      error = 'Product slug is required';
      return false;
    }
    
    if (!product.description) {
      error = 'Product description is required';
      return false;
    }
    
    if (!product.shortDescription) {
      error = 'Product short description is required';
      return false;
    }
    
    if (!product.price || product.price <= 0) {
      error = 'Product price must be greater than zero';
      return false;
    }
    
    if (product.discountPrice && product.discountPrice >= product.price) {
      error = 'Discount price must be less than regular price';
      return false;
    }
    
    if (!product.categoryId) {
      error = 'Please select a category';
      return false;
    }
    
    return true;
  }
</script>

<svelte:head>
  <title>Create New Product | Portfolia</title>
  <meta name="description" content="Create a new product to sell on the marketplace" />
</svelte:head>

<div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
  <PageHeader
    title="Create New Product"
    description="Add a new product to sell on the marketplace"
  >
    <Button href="/creators/dashboard" variant="ghost">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      Back to Dashboard
    </Button>
  </PageHeader>
  
  {#if loading}
    <div class="flex justify-center py-16">
      <LoadingSpinner size="lg" />
    </div>
  {:else if success}
    <AlertBox type="success" class="my-8">
      Product created successfully! Redirecting to products page...
    </AlertBox>
  {:else}
    <Card>
      <div class="p-6">
        {#if error}
          <AlertBox type="error" dismissible bind:visible={error} class="mb-6">
            {error}
          </AlertBox>
        {/if}
        
        <Tabs
          tabs={[
            { id: 'basic', label: 'Basic Information' },
            { id: 'media', label: 'Media & Files' },
            { id: 'features', label: 'Features & Specs' },
            { id: 'pricing', label: 'Pricing & Availability' }
          ]}
          bind:activeTab
        />
        
        <div class="mt-6">
          <!-- Basic Information Tab -->
          {#if activeTab === 'basic'}
            <div class="space-y-6">
              <div class="grid grid-cols-1 gap-6">
                <TextField 
                  label="Product Name"
                  bind:value={product.name}
                  placeholder="Enter product name"
                  required
                  on:input={generateSlug}
                />
                
                <TextField 
                  label="Product URL Slug"
                  bind:value={product.slug}
                  placeholder="product-url-slug"
                  hint="Used for the URL (e.g., marketplace/products/product-url-slug)"
                  required
                />
                
                <TextAreaField
                  label="Short Description"
                  bind:value={product.shortDescription}
                  placeholder="Brief description of your product (displayed in listings)"
                  rows={2}
                  maxLength={150}
                  showCount
                  required
                />
                
                <TextAreaField
                  label="Full Description"
                  bind:value={product.description}
                  placeholder="Detailed description of your product"
                  rows={6}
                  required
                />
                
                <Select
                  label="Category"
                  bind:value={product.categoryId}
                  options={categories.map(category => ({
                    value: category.id,
                    label: category.name
                  }))}
                  required
                />
                
                <TagInput
                  label="Tags"
                  bind:tags={product.tags}
                  placeholder="Add tags and press Enter"
                  hint="Add up to 10 tags to help customers find your product"
                />
              </div>
              
              <div class="flex justify-end">
                <Button variant="primary" on:click={() => activeTab = 'media'}>
                  Continue to Media & Files
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
            </div>
          
          <!-- Media & Files Tab -->
          {:else if activeTab === 'media'}
            <div class="space-y-6">
              <div>
                <h3 class="text-lg font-medium mb-2">Preview Images</h3>
                <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                  Add images that showcase your product. The first image will be used as the main preview.
                </p>
                
                <FileUpload
                  multiple={true}
                  accept="image/*"
                  maxSize={5242880} <!-- 5MB -->
                  hint="Up to 5 images, max 5MB each"
                  on:upload={handlePreviewUpload}
                />
                
                {#if previewFiles.length > 0}
                  <div class="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {#each previewFiles as file, index}
                      <div class="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          class="w-full h-32 object-cover rounded-md"
                        />
                        <button
                          type="button"
                          class="absolute top-2 right-2 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-full p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                          on:click={() => {
                            previewFiles = previewFiles.filter((_, i) => i !== index);
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
              
              <div class="pt-6 border-t border-neutral-200 dark:border-neutral-700">
                <h3 class="text-lg font-medium mb-2">Product File</h3>
                <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                  Upload the digital product file that customers will download after purchase.
                </p>
                
                <FileUpload
                  multiple={false}
                  accept=".zip,.pdf,.psd,.ai,.sketch,.fig,.xd"
                  maxSize={104857600} <!-- 100MB -->
                  hint="Max 100MB. Supported formats: ZIP, PDF, PSD, AI, Sketch, Figma, XD"
                  on:upload={handleProductFileUpload}
                />
                
                {#if productFile}
                  <div class="mt-4 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-between">
                    <div>
                      <p class="font-medium">{productFile.name}</p>
                      <p class="text-sm text-neutral-600 dark:text-neutral-400">
                        {formatFileSize(productFile.size)} • {productFile.type || 'Unknown type'}
                      </p>
                    </div>
                    <button
                      type="button"
                      class="text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
                      on:click={() => {
                        productFile = null;
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                {/if}
              </div>
              
              <div class="flex justify-between">
                <Button variant="outline" on:click={() => activeTab = 'basic'}>
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </Button>
                <Button variant="primary" on:click={() => activeTab = 'features'}>
                  Continue to Features & Specs
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
            </div>
          
          <!-- Features & Specs Tab -->
          {:else if activeTab === 'features'}
            <div class="space-y-6">
              <div>
                <h3 class="text-lg font-medium mb-2">Product Features</h3>
                <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                  List the key features of your product to highlight what makes it valuable.
                </p>
                
                <div class="flex">
                  <TextField
                    bind:value={newFeature}
                    placeholder="Enter a feature"
                    class="flex-grow"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addFeature();
                      }
                    }}
                  />
                  <Button class="ml-2" on:click={addFeature}>
                    Add
                  </Button>
                </div>
                
                {#if product.features && product.features.length > 0}
                  <div class="mt-4 space-y-2">
                    {#each product.features as feature, index}
                      <div class="flex items-center justify-between p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                        <span>{feature}</span>
                        <button
                          type="button"
                          class="text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
                          on:click={() => removeFeature(index)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    {/each}
                  </div>
                {:else}
                  <div class="mt-4 p-6 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg text-center">
                    <p class="text-neutral-500 dark:text-neutral-400">No features added yet</p>
                  </div>
                {/if}
              </div>
              
              <div class="pt-6 border-t border-neutral-200 dark:border-neutral-700">
                <h3 class="text-lg font-medium mb-2">Product Specifications</h3>
                <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                  Add technical specifications or additional details about your product.
                </p>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <TextField
                    bind:value={specKey}
                    placeholder="Specification name (e.g., File Format)"
                  />
                  <div class="flex">
                    <TextField
                      bind:value={specValue}
                      placeholder="Specification value (e.g., PDF)"
                      class="flex-grow"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addSpecification();
                        }
                      }}
                    />
                    <Button class="ml-2" on:click={addSpecification}>
                      Add
                    </Button>
                  </div>
                </div>
                
                {#if product.specifications && Object.keys(product.specifications).length > 0}
                  <div class="mt-4 space-y-2">
                    {#each Object.entries(product.specifications) as [key, value]}
                      <div class="flex items-center justify-between p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                        <div>
                          <span class="font-medium">{key}</span>
                          <span class="mx-2">•</span>
                          <span>{value}</span>
                        </div>
                        <button
                          type="button"
                          class="text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
                          on:click={() => removeSpecification(key)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    {/each}
                  </div>
                {:else}
                  <div class="mt-4 p-6 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg text-center">
                    <p class="text-neutral-500 dark:text-neutral-400">No specifications added yet</p>
                  </div>
                {/if}
              </div>
              
              <div class="flex justify-between">
                <Button variant="outline" on:click={() => activeTab = 'media'}>
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </Button>
                <Button variant="primary" on:click={() => activeTab = 'pricing'}>
                  Continue to Pricing & Availability
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
            </div>
          
          <!-- Pricing & Availability Tab -->
          {:else if activeTab === 'pricing'}
            <div class="space-y-6">
              <div>
                <h3 class="text-lg font-medium mb-2">Pricing</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <TextField
                      label="Regular Price"
                      type="number"
                      min="0"
                      step="0.01"
                      bind:value={product.price}
                      placeholder="0.00"
                      prefix="$"
                      required
                    />
                    <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                      Set the standard price for your product.
                    </p>
                  </div>
                  
                  <div>
                    <TextField
                      label="Discount Price (Optional)"
                      type="number"
                      min="0"
                      step="0.01"
                      bind:value={product.discountPrice}
                      placeholder="0.00"
                      prefix="$"
                    />
                    <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                      Set a promotional price if offering a discount.
                    </p>
                  </div>
                  
                  <div>
                    <Select
                      label="Currency"
                      bind:value={product.currency}
                      options={[
                        { value: 'USD', label: 'USD ($)' },
                        { value: 'EUR', label: 'EUR (€)' },
                        { value: 'GBP', label: 'GBP (£)' },
                        { value: 'CAD', label: 'CAD (C$)' },
                        { value: 'AUD', label: 'AUD (A$)' }
                      ]}
                      required
                    />
                  </div>
                  
                  {#if product.discountPrice && product.price}
                    <div>
                      <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Discount
                      </label>
                      <div class="p-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-md">
                        {#if product.price > 0}
                          {Math.round(((product.price - product.discountPrice) / product.price) * 100)}% off
                        {/if}
                      </div>
                    </div>
                  {/if}
                </div>
              </div>
              
              <div class="pt-6 border-t border-neutral-200 dark:border-neutral-700">
                <h3 class="text-lg font-medium mb-2">Availability & Publishing</h3>
                <div class="space-y-4">
                  <Checkbox
                    label="Publish product immediately"
                    bind:checked={product.isPublished}
                    hint="If unchecked, product will be saved as a draft"
                  />
                  
                  <div class="p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-md">
                    <h4 class="font-medium text-amber-800 dark:text-amber-300">Review Process</h4>
                    <p class="mt-1 text-sm text-amber-700 dark:text-amber-400">
                      All products must be reviewed and approved before they become visible in the marketplace. This process usually takes 1-2 business days.
                    </p>
                  </div>
                </div>
              </div>
              
              <div class="pt-6 border-t border-neutral-200 dark:border-neutral-700">
                <div class="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-md">
                  <h3 class="font-medium mb-2">Ready to Submit?</h3>
                  <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                    Please review all information before submitting your product. You can always edit it later.
                  </p>
                  <div class="flex justify-between">
                    <Button variant="outline" on:click={() => activeTab = 'features'}>
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                      </svg>
                      Back
                    </Button>
                    
                    <div class="flex space-x-3">
                      <Button variant="outline" on:click={() => goto('/creators/dashboard')}>
                        Cancel
                      </Button>
                      <Button 
                        variant="primary"
                        on:click={saveProduct}
                        disabled={savingProduct}
                      >
                        {#if savingProduct}
                          <LoadingSpinner size="sm" class="mr-2" />
                          Creating Product...
                        {:else}
                          Create Product
                        {/if}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          {/if}
        </div>
      </div>
    </Card>
  {/if}
</div>