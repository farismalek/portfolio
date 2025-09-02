<script lang="ts">
  import { portfolioEditorStore } from '$lib/stores/portfolioEditorStore';
  
  export let data: any = {};
  export let isEditing: boolean = false;
  
  // Provide default values for new components
  $: {
    if (isEditing) {
      data = {
        title: data.title || 'Get in Touch',
        subtitle: data.subtitle || 'Have a project in mind? Let's talk about it.',
        email: data.email || 'hello@example.com',
        phone: data.phone || '+1 (555) 123-4567',
        location: data.location || 'New York, NY',
        socialLinks: data.socialLinks || [
          { platform: 'Twitter', url: 'https://twitter.com/' },
          { platform: 'LinkedIn', url: 'https://linkedin.com/in/' },
          { platform: 'Dribbble', url: 'https://dribbble.com/' }
        ],
        layout: data.layout || 'split', // 'split' or 'centered'
        showForm: data.showForm !== undefined ? data.showForm : true,
        ...data
      };
    }
  }
  
  // Update component data when values change
  function updateData(updates: any) {
    if (!isEditing) return;
    
    const updatedData = { ...data, ...updates };
    portfolioEditorStore.updateComponent(data.id, updatedData);
  }
  
  // Get social icon based on platform name
  function getSocialIcon(platform: string): string {
    const icons: Record<string, string> = {
      'Twitter': 'M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84',
      'LinkedIn': 'M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z',
      'GitHub': 'M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z',
      'Dribbble': 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.51 0 10-4.48 10-10S17.51 2 12 2zm6.605 4.61a8.502 8.502 0 011.93 5.314c-.281-.054-3.101-.629-5.943-.271-.065-.141-.12-.293-.184-.445a25.416 25.416 0 00-.564-1.236c3.145-1.28 4.577-3.124 4.761-3.362zM12 3.475c2.17 0 4.154.813 5.662 2.148-.152.216-1.443 1.941-4.48 3.08-1.399-2.57-2.95-4.675-3.189-5A8.687 8.687 0 0112 3.475zm-3.633.803a53.896 53.896 0 013.167 4.935c-3.992 1.063-7.517 1.04-7.896 1.04a8.581 8.581 0 014.729-5.975zM3.453 12.01v-.26c.37.01 4.512.065 8.775-1.215.25.477.477.965.694 1.453-.109.033-.228.065-.336.098-4.404 1.42-6.747 5.303-6.942 5.629a8.522 8.522 0 01-2.19-5.705zM12 20.547a8.482 8.482 0 01-5.239-1.8c.152-.315 1.888-3.656 6.703-5.337.022-.01.033-.01.054-.022a35.318 35.318 0 011.823 6.475 8.4 8.4 0 01-3.341.684zm4.761-1.465c-.086-.52-.542-3.015-1.659-6.084 2.679-.423 5.022.271 5.314.369a8.468 8.468 0 01-3.655 5.715z',
      'Instagram': 'M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z',
      'YouTube': 'M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z',
      'Facebook': 'M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z',
      'default': 'M6 5c-1.105 0-2 .895-2 2s.895 2 2 2 2-.895 2-2-.895-2-2-2zM17 5c-1.105 0-2 .895-2 2s.895 2 2 2 2-.895 2-2-.895-2-2-2zM12 5c-1.105 0-2 .895-2 2s.895 2 2 2 2-.895 2-2-.895-2-2-2z'
    };
    
    // Try to match platform name (case insensitive)
    const platformKey = Object.keys(icons).find(
      key => key.toLowerCase() === platform.toLowerCase()
    );
    
    return platformKey ? icons[platformKey] : icons.default;
  }
</script>

<section class="py-16 bg-white">
  <div class="container mx-auto px-4">
    <div class="text-center mb-12">
      <h2 class="text-3xl font-bold text-neutral-900 mb-4">{data.title}</h2>
      <p class="text-xl text-neutral-600 max-w-3xl mx-auto">{data.subtitle}</p>
    </div>

    {#if data.layout === "split"}
      <!-- Split layout -->
      <div class="flex flex-col lg:flex-row">
        <!-- Contact information -->
        <div class="lg:w-1/2 lg:pr-12">
          <div class="bg-neutral-50 p-8 rounded-lg">
            <h3 class="text-xl font-bold mb-6">Contact Information</h3>

            <div class="space-y-4">
              {#if data.email}
                <div class="flex items-start">
                  <div class="flex-shrink-0 mt-1">
                    <svg
                      class="h-6 w-6 text-primary-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div class="ml-3">
                    <h4 class="text-sm font-medium text-neutral-500">Email</h4>
                    <a
                      href={`mailto:${data.email}`}
                      class="text-primary-600 hover:text-primary-800"
                      >{data.email}</a
                    >
                  </div>
                </div>
              {/if}

              {#if data.phone}
                <div class="flex items-start">
                  <div class="flex-shrink-0 mt-1">
                    <svg
                      class="h-6 w-6 text-primary-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  </div>
                  <div class="ml-3">
                    <h4 class="text-sm font-medium text-neutral-500">Phone</h4>
                    <a
                      href={`tel:${data.phone}`}
                      class="text-primary-600 hover:text-primary-800"
                      >{data.phone}</a
                    >
                  </div>
                </div>
              {/if}

              {#if data.location}
                <div class="flex items-start">
                  <div class="flex-shrink-0 mt-1">
                    <svg
                      class="h-6 w-6 text-primary-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div class="ml-3">
                    <h4 class="text-sm font-medium text-neutral-500">
                      Location
                    </h4>
                    <p class="text-neutral-900">{data.location}</p>
                  </div>
                </div>
              {/if}
            </div>

            <!-- Social links -->
            {#if data.socialLinks && data.socialLinks.length > 0}
              <div class="mt-8">
                <h4 class="text-sm font-medium text-neutral-500 mb-4">
                  Connect with me
                </h4>
                <div class="flex space-x-4">
                  {#each data.socialLinks as social}
                    <a
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-neutral-500 hover:text-primary-600"
                      title={social.platform}
                    >
                      <svg
                        class="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d={getSocialIcon(social.platform)} />
                      </svg>
                    </a>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        </div>

        <!-- Contact form -->
        {#if data.showForm}
          <div class="lg:w-1/2 lg:pl-12 mt-8 lg:mt-0">
            <form class="space-y-6">
              <div>
                <label
                  for="name"
                  class="block text-sm font-medium text-neutral-700">Name</label
                >
                <input
                  type="text"
                  id="name"
                  name="name"
                  class="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="Your name"
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label
                  for="email"
                  class="block text-sm font-medium text-neutral-700"
                  >Email</label
                >
                <input
                  type="email"
                  id="email"
                  name="email"
                  class="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="your.email@example.com"
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label
                  for="subject"
                  class="block text-sm font-medium text-neutral-700"
                  >Subject</label
                >
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  class="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="How can I help you?"
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label
                  for="message"
                  class="block text-sm font-medium text-neutral-700"
                  >Message</label
                >
                <textarea
                  id="message"
                  name="message"
                  rows="4"
                  class="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="Your message"
                  disabled={!isEditing}
                ></textarea>
              </div>

              <div>
                <button
                  type="submit"
                  class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  disabled={!isEditing}
                >
                  Send Message
                </button>
              </div>
            </form>
          </div>
        {/if}
      </div>
    {:else}
      <!-- Centered layout -->
      <div class="max-w-3xl mx-auto">
        <!-- Contact information -->
        <div class="bg-neutral-50 p-8 rounded-lg">
          <div
            class="flex flex-col sm:flex-row sm:justify-around items-start gap-6"
          >
            {#if data.email}
              <div class="flex flex-col items-center text-center">
                <div class="bg-white rounded-full p-4 shadow-sm">
                  <svg
                    class="h-6 w-6 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h4 class="mt-4 text-sm font-medium text-neutral-500">Email</h4>
                <a
                  href={`mailto:${data.email}`}
                  class="text-primary-600 hover:text-primary-800"
                  >{data.email}</a
                >
              </div>
            {/if}

            {#if data.phone}
              <div class="flex flex-col items-center text-center">
                <div class="bg-white rounded-full p-4 shadow-sm">
                  <svg
                    class="h-6 w-6 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </div>
                <h4 class="mt-4 text-sm font-medium text-neutral-500">Phone</h4>
                <a
                  href={`tel:${data.phone}`}
                  class="text-primary-600 hover:text-primary-800"
                  >{data.phone}</a
                >
              </div>
            {/if}

            {#if data.location}
              <div class="flex flex-col items-center text-center">
                <div class="bg-white rounded-full p-4 shadow-sm">
                  <svg
                    class="h-6 w-6 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <h4 class="mt-4 text-sm font-medium text-neutral-500">
                  Location
                </h4>
                <p class="text-neutral-900">{data.location}</p>
              </div>
            {/if}
          </div>

          <!-- Social links -->
          {#if data.socialLinks && data.socialLinks.length > 0}
            <div class="mt-8 flex justify-center">
              <div class="flex space-x-4">
                {#each data.socialLinks as social}
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-neutral-500 hover:text-primary-600"
                    title={social.platform}
                  >
                    <svg
                      class="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d={getSocialIcon(social.platform)} />
                    </svg>
                  </a>
                {/each}
              </div>
            </div>
          {/if}
        </div>

        <!-- Contact form -->
        {#if data.showForm}
          <div class="mt-10">
            <form class="space-y-6">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label
                    for="name"
                    class="block text-sm font-medium text-neutral-700"
                    >Name</label
                  >
                  <input
                    type="text"
                    id="name"
                    name="name"
                    class="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    placeholder="Your name"
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <label
                    for="email"
                    class="block text-sm font-medium text-neutral-700"
                    >Email</label
                  >
                  <input
                    type="email"
                    id="email"
                    name="email"
                    class="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    placeholder="your.email@example.com"
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div>
                <label
                  for="subject"
                  class="block text-sm font-medium text-neutral-700"
                  >Subject</label
                >
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  class="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="How can I help you?"
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label
                  for="message"
                  class="block text-sm font-medium text-neutral-700"
                  >Message</label
                >
                <textarea
                  id="message"
                  name="message"
                  rows="4"
                  class="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="Your message"
                  disabled={!isEditing}
                ></textarea>
              </div>

              <div class="flex justify-center">
                <button
                  type="submit"
                  class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  disabled={!isEditing}
                >
                  Send Message
                </button>
              </div>
            </form>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</section>

{#if isEditing}
  <div class="bg-neutral-50 p-4 border-t border-neutral-200">
    <div class="text-sm text-neutral-500">
      Click to edit contact information, social links, and form settings.
    </div>
  </div>
{/if}
