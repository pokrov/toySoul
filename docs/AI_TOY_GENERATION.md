# Concept generation

The default provider is a deterministic **local concept engine**, not a real AI model. It recognizes color, mood, archetype and feature keywords; hashes the normalized prompt/mood/palette; and returns three reproducible supported configurations.

Both local and external paths use designSchema. The schema bounds identity text and enumerates renderer-supported body, face, finish, ear, horn, tail, pattern and accessory options.

Optional server-only environment variables:

    AI_BASE_URL=https://your-compatible-provider.example/v1
    AI_API_KEY=server-only-secret
    AI_MODEL=your-structured-output-model

When all three are configured, ExternalProvider calls the provider's /chat/completions JSON endpoint with a 15-second timeout. Unsupported/missing fields fall back to supported local defaults; every resulting object is validated. Invalid response shapes, request failures and timeouts return local concepts with a visible fallback label.

No prompt text is treated as an instruction to the application. Prompts and identity fields are length-bounded and checked for a small list of obvious abuse. This is a demo safeguard, not comprehensive multilingual content moderation. Administrators can hold a design from the pool/gallery and edit inappropriate identity text with an audit record.

Guest exploration uses the local engine in the browser. Signed-in generation uses the server endpoint and its optional provider. API keys are never bundled into client code.

Three concept illustrations are procedural previews. Selecting a concept feeds its structured data into the separate live 3D renderer. External image generation is intentionally not implemented; no generated image is represented as a mesh.
