<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from "vue";

interface Props {
  terminalInstance?: any; 
  onSendStdin: (data: string) => void;
}

const props = withDefaults(defineProps<Props>(), {
  terminalInstance: null
});

const inputRef = ref<HTMLInputElement | null>(null);
const inputValue = ref("");

const isComposing = ref(false);
const isPendingFlush = ref(false);

const handleCompositionStart = () => {
  isComposing.value = true;
  isPendingFlush.value = false;
};

const handleCompositionUpdate = () => {
  isComposing.value = true;
};

const handleCompositionEnd = async () => {
  isComposing.value = false;
  isPendingFlush.value = true;

  await nextTick();
  if (isPendingFlush.value) {
    flushChunk();
  }
};

const handleInput = () => {
  if (isComposing.value) return;
  if (!isPendingFlush.value) {
    flushChunk();
  }
};

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === "Enter") {
    if (isComposing.value) return;
    props.onSendStdin(inputValue.value + "\r");
    clearBuffer();
    event.preventDefault();
  }
};

const flushChunk = () => {
  const chunk = inputValue.value;
  if (chunk.length > 0) {
    props.onSendStdin(chunk);
    clearBuffer();
  }
};

const clearBuffer = () => {
  inputValue.value = "";
  if (inputRef.value) {
    inputRef.value.value = "";
  }
  isComposing.value = false;
  isPendingFlush.value = false;
};

const focusSandbox = () => {
  if (inputRef.value) {
    inputRef.value.focus();
  }
};

onMounted(() => {
  if (props.terminalInstance) {
    props.terminalInstance.onTextAreaFocus?.(focusSandbox);
  }
});

onUnmounted(() => {
  clearBuffer();
});

defineExpose({
  focusSandbox,
  clearBuffer,
  isComposing
});
</script>

<template>
  <div class="decoupled-terminal-input-container">
    <input
      ref="inputRef"
      v-model="inputValue"
      type="text"
      class="sandbox-input"
      autocapitalize="off"
      autocomplete="off"
      autocorrect="off"
      spellcheck="false"
      @compositionstart="handleCompositionStart"
      @compositionupdate="handleCompositionUpdate"
      @compositionend="handleCompositionEnd"
      @input="handleInput"
      @keydown="handleKeyDown"
    />
  </div>
</template>

<style scoped>
.decoupled-terminal-input-container {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  overflow: hidden;
  z-index: -1;
}
.sandbox-input {
  width: 100%;
  height: 100%;
  border: none;
  background: transparent;
  outline: none;
}
</style>