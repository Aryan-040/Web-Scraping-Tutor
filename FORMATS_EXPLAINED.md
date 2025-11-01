# Why Different Dataset Formats?

Different LLM training frameworks and APIs require data in **specific formats**. We provide 3 formats so your dataset works with the most popular training methods.

---

## The 3 Formats Explained

### 1. **OpenAI Format** (`openai_format.jsonl`)

**Structure:**
```json
{
  "messages": [
    { "role": "system", "content": "Instruction..." },
    { "role": "user", "content": "Input..." },
    { "role": "assistant", "content": "Output..." }
  ]
}
```

**Used For:**
- OpenAI Fine-tuning API (`gpt-3.5-turbo`, `gpt-4`)
- Azure OpenAI Service fine-tuning
- Anthropic Claude fine-tuning
- Any API that uses chat/completion format with roles

**Why Needed:**
OpenAI's API expects the conversational structure with `system`, `user`, and `assistant` roles. This format mimics how ChatGPT works internally.

**Example Use:**
```bash
openai api fine_tunes.create \
  -t openai_format.jsonl \
  -m gpt-3.5-turbo
```

---

### 2. **Alpaca Format** (`alpaca_format.jsonl`)

**What is Alpaca?**
- Named after **Stanford Alpaca** - an open-source instruction-following AI model (2023)
- The format became a standard used by many instruction-following models
- **Not an AI itself** - it's a data format named after the model!

**Structure:**
```json
{
  "instruction": "Instruction...",
  "input": "Input...",
  "output": "Output..."
}
```

**Used For:**
- Alpaca models (Stanford's instruction-following LLMs)
- LLaMA fine-tuning with instruction format
- Hugging Face Transformers (many instruction models)
- Custom model training (popular open-source format)
- Models like: Vicuna, Koala, Dolly, etc.

**Why Needed:**
This format separates instruction, input, and output clearly - perfect for training models to follow instructions and handle structured tasks.

**Example Use:**
```python
from transformers import AutoTokenizer, AutoModelForCausalLM

# Load your dataset in Alpaca format
# Train instruction-following model
```

---

### 3. **Completion Format** (`completion_format.jsonl`)

**What is Completion Format?**
- **Not named after a specific AI** - it's a general format for text completion tasks
- Used for models that predict "what comes next" in text
- Simple prompt → completion structure

**Structure:**
```json
{
  "prompt": "Instruction + Input...",
  "completion": " Output..."
}
```

**Used For:**
- GPT-3 base model fine-tuning (older OpenAI API)
- Text completion models
- Language modeling tasks
- Autoregressive model training
- Models that generate continuations

**Why Needed:**
Simpler format for "prompt → completion" style training. The completion starts with a space (important for tokenization) and is designed for text continuation tasks.

**Example Use:**
```bash
openai api fine_tunes.create \
  -t completion_format.jsonl \
  -m davinci  # Base GPT-3 model
```

---

## Quick Decision Guide

**Choose OpenAI Format if:**
- You're using OpenAI's API
- You want chat/conversational models
- You're fine-tuning GPT-3.5 or GPT-4

**Choose Alpaca Format if:**
- You're training open-source models
- You want instruction-following capabilities
- You're using Hugging Face
- You're training LLaMA, Vicuna, etc.

**Choose Completion Format if:**
- You're fine-tuning older GPT-3 base models
- You need simple prompt→completion training
- You're doing text continuation tasks

---

## Why Not Just One Format?

**Problem:** Each training framework expects a specific format. Using the wrong format means:
- Training pipeline errors
- Wrong data interpretation
- Poor model performance
- Extra work converting formats manually

**Solution:** We generate all 3 formats automatically, so you can:
- Use any training framework immediately
- Switch between different models easily
- Share data with others (they can use their preferred format)
- Test different training approaches

---

##  Format Comparison

| Feature | OpenAI | Alpaca | Completion |
|---------|--------|--------|------------|
| **Complexity** | Medium | Low | Low |
| **Best For** | Chat APIs | Instruction models | Text completion |
| **Structure** | Role-based | Field-based | Simple prompt/response |
| **Popularity** | Very High | High | Medium |

---

##  Technical Details

### OpenAI Format Advantages:
- Mimics actual chat structure
- Supports system prompts (important for behavior control)
- Works with modern chat APIs

### Alpaca Format Advantages:
- Simple, clear structure
- Widely supported in open-source community
- Easy to parse and process

### Completion Format Advantages:
- Simplest format
- Works with autoregressive models
- Good for text generation tasks

---

##  Real-World Usage

**Scenario 1: Fine-tuning GPT-3.5 for your company**
→ Use `openai_format.jsonl`

**Scenario 2: Training an open-source LLaMA model**
→ Use `alpaca_format.jsonl`

**Scenario 3: Creating a domain-specific completion model**
→ Use `completion_format.jsonl`

---

## Summary

**Important Clarification:**
- **Alpaca format** = Named after Stanford Alpaca AI model (a real model), but it's a **data format**, not an AI
- **Completion format** = General format name for text completion (not named after a specific AI)

Having multiple formats ensures your dataset is **universally compatible** with different training frameworks. You don't need to know which format to use upfront - just generate all 3 and use the one your training framework requires!

This saves time and makes your dataset more valuable and reusable.

📖For more details on what these formats are and why they exist, see `FORMATS_DETAILED.md`

