# Models Folder

Place your GGUF model files in this folder. The application will automatically detect them.

## How to Add Models

1. Download GGUF format models from sources like:
   - Hugging Face (https://huggingface.co/models?library=gguf)
   - TheBloke's collection (https://huggingface.co/TheBloke)
   - Other GGUF model repositories

2. Place the `.gguf` files directly in this folder

3. The models will automatically appear in the AI Settings under Local GGUF Model

## Recommended Models

For best performance in this application, consider models in the 3B-7B parameter range:

- **Llama 3.2 3B GGUF** - Good balance of speed and quality
- **Phi-3 Mini GGUF** - Fast and efficient
- **Gemma 2B GGUF** - Very fast, good for quick responses
- **Mistral 7B GGUF** - Higher quality responses, requires more resources

## File Sizes

Typical GGUF model sizes:
- 2B parameters: ~1.5-2 GB
- 3B parameters: ~2-3 GB  
- 7B parameters: ~4-8 GB (depending on quantization)

## Notes

- The application does NOT download models automatically
- Models remain on your local machine
- No internet connection required once models are installed
- You can add/remove models at any time by modifying this folder
