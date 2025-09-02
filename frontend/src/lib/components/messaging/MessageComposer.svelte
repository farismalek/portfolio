<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from "svelte";
  import { fade, slide } from "svelte/transition";
  import Button from "../common/Button.svelte";
  import { authUser } from "$lib/stores/authStore";
  import { sendMessage } from "$lib/services/messageService";
  import { messagingSocket } from "$lib/services/messagingSocket";
  import { MessageType } from "$lib/types/network";

  export let conversationId;
  export let replyToMessage = null;

  let content = "";
  let isTyping = false;
  let textareaEl;
  let attachmentMenuOpen = false;
  let fileInput;
  let isSubmitting = false;
  let error = null;
  let typingTimeout;

  const dispatch = createEventDispatcher();

  onMount(() => {
    // Focus textarea on mount
    if (textareaEl) {
      textareaEl.focus();
    }
  });

  onDestroy(() => {
    // Clear typing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Send stopped typing notification when leaving
    if (isTyping) {
      messagingSocket.emit("typing:stop", { conversationId });
    }
  });

  // Adjust textarea height as content grows
  function adjustTextareaHeight() {
    if (textareaEl) {
      textareaEl.style.height = "0";
      textareaEl.style.height = `${Math.min(textareaEl.scrollHeight, 150)}px`;
    }
  }

  // Handle user typing events
  function handleInput() {
    adjustTextareaHeight();

    // Send typing indicator
    if (!isTyping && content.trim()) {
      isTyping = true;
      messagingSocket.emit("typing:start", { conversationId });
    }

    // Reset typing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Set timeout to stop typing indicator
    typingTimeout = setTimeout(() => {
      if (isTyping) {
        isTyping = false;
        messagingSocket.emit("typing:stop", { conversationId });
      }
    }, 3000);
  }

  // Handle key events
  function handleKeyDown(event) {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      sendTextMessage();
    }
  }

  // Handle text message submission
  async function sendTextMessage() {
    if (!content.trim() || isSubmitting || !$authUser) return;

    isSubmitting = true;
    error = null;

    try {
      const message = await sendMessage({
        conversationId,
        senderId: $authUser.id,
        content: content.trim(),
        type: MessageType.TEXT,
        parentId: replyToMessage?.id,
      });

      // Clear input and reset state
      content = "";
      replyToMessage = null;
      adjustTextareaHeight();

      // Stop typing indicator
      if (isTyping) {
        isTyping = false;
        messagingSocket.emit("typing:stop", { conversationId });
      }

      // Notify parent component
      dispatch("messageSent", message);
    } catch (err) {
      console.error("Failed to send message:", err);
      error = err.message || "Failed to send message";
    } finally {
      isSubmitting = false;
    }
  }

  // Handle file selection
  async function handleFileSelection(event) {
    const file = event.target.files[0];
    if (!file) return;

    isSubmitting = true;
    error = null;
    attachmentMenuOpen = false;

    try {
      // In a production app, we would upload the file to a server first
      // and get a URL back. For this example, we'll simulate that.
      const fileType = file.type.startsWith("image/")
        ? MessageType.IMAGE
        : MessageType.FILE;

      // Create a local URL for the file (in production, this would be the uploaded URL)
      const reader = new FileReader();
      reader.onload = async (e) => {
        const fileUrl = e.target.result;

        // Send message with file attachment
        const message = await sendMessage({
          conversationId,
          senderId: $authUser.id,
          content: "", // Optional caption could go here
          type: fileType,
          parentId: replyToMessage?.id,
          media: {
            url: fileUrl,
            filename: file.name,
            filesize: file.size,
            fileType: file.type,
          },
        });

        // Reset state
        replyToMessage = null;

        // Notify parent component
        dispatch("messageSent", message);

        // Reset file input
        fileInput.value = "";
        isSubmitting = false;
      };

      reader.onerror = () => {
        throw new Error("Failed to read file");
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Failed to send file:", err);
      error = err.message || "Failed to send file";
      isSubmitting = false;
    }
  }

  // Handle cancel reply
  function cancelReply() {
    replyToMessage = null;
  }

  // Toggle attachment menu
  function toggleAttachmentMenu() {
    attachmentMenuOpen = !attachmentMenuOpen;
  }

  function uploadImage() {
    fileInput.accept = "image/*";
    fileInput.click();
    attachmentMenuOpen = false;
  }

  function uploadFile() {
    fileInput.accept = "*/*";
    fileInput.click();
    attachmentMenuOpen = false;
  }
</script>

<div class="flex flex-col">
  <!-- Reply indicator -->
  {#if replyToMessage}
    <div
      class="flex items-center bg-neutral-50 p-2 rounded mb-2 border-l-4 border-primary-500"
      transition:slide={{ duration: 200 }}
    >
      <div class="flex-1 overflow-hidden">
        <div class="text-xs font-medium text-primary-700">
          Replying to {replyToMessage.sender?.fullName ||
            replyToMessage.sender?.username ||
            "User"}
        </div>
        <div class="text-sm text-neutral-600 truncate">
          {replyToMessage.content || "Media message"}
        </div>
      </div>
      <button
        class="ml-2 p-1 rounded-full hover:bg-neutral-200 text-neutral-500"
        on:click={cancelReply}
      >
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  {/if}

  <!-- Error message -->
  {#if error}
    <div
      class="p-2 text-sm text-red-600 bg-red-50 rounded mb-2"
      transition:fade={{ duration: 200 }}
    >
      {error}
    </div>
  {/if}

  <div class="flex items-end space-x-2">
    <!-- Attachment button -->
    <div class="relative flex-shrink-0">
      <button
        class="p-2.5 rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
        on:click={toggleAttachmentMenu}
        disabled={isSubmitting}
      >
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
          />
        </svg>
      </button>

      <!-- Attachment menu -->
      {#if attachmentMenuOpen}
        <div
          class="absolute bottom-full mb-1 left-0 bg-white shadow-lg rounded-lg border border-neutral-200 py-1 w-40"
          transition:fade={{ duration: 150 }}
        >
          <button
            class="w-full text-left px-3 py-2 hover:bg-neutral-100 flex items-center"
            on:click={uploadImage}
          >
            <svg
              class="w-4 h-4 mr-2 text-neutral-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Image
          </button>
          <button
            class="w-full text-left px-3 py-2 hover:bg-neutral-100 flex items-center"
            on:click={uploadFile}
          >
            <svg
              class="w-4 h-4 mr-2 text-neutral-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
            File
          </button>
        </div>
      {/if}
    </div>

    <!-- Hidden file input -->
    <input
      type="file"
      class="hidden"
      bind:this={fileInput}
      on:change={handleFileSelection}
    />

    <!-- Message input -->
    <div class="flex-1 relative">
      <textarea
        bind:this={textareaEl}
        bind:value={content}
        on:input={handleInput}
        on:keydown={handleKeyDown}
        class="w-full pl-3 pr-12 py-2 border border-neutral-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 resize-none"
        placeholder="Type a message..."
        rows="1"
        disabled={isSubmitting}
      ></textarea>

      <!-- Emoji button -->
      <button
        class="absolute right-2 bottom-2.5 p-1 rounded-full text-neutral-500 hover:bg-neutral-100"
        title="Add emoji"
      >
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>
    </div>

    <!-- Send button -->
    <Button
      variant="primary"
      size="sm"
      disabled={!content.trim() || isSubmitting}
      loading={isSubmitting}
      on:click={sendTextMessage}
    >
      <svg
        class="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
        />
      </svg>
    </Button>
  </div>
</div>
