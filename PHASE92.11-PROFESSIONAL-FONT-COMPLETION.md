# Phase 92.11 — Professional Font Completion

Phase 92.11 continues the 92.10 international typography work and closes several gaps that made the font experience inconsistent across Yaposan Publisher.

## Included

- One central Publisher font catalog now powers legacy text font pickers as well as Publisher.
- Font Manager adds **Document Fonts** and **Missing** views.
- Font rows show source badges (Catalog / Installed / Embedded), document-use state, missing status, and variable-font capability.
- Common families expose style metadata, including regular, bold, italic, and variable-weight families where applicable.
- Language-aware search aliases make queries such as Amharic, Tigrinya, Persian, Urdu, Chinese, Japanese, Korean, Hindi, Bengali, Punjabi, Thai, Khmer, and Burmese resolve to compatible catalog families.
- Missing-document-font detection is centralized.
- Replacement-candidate ranking prefers available fonts with matching category and script compatibility.
- Web runtime checks can query a font against the actual selected text through the browser FontFaceSet API.

## Notes

The browser FontFaceSet check improves runtime validation but is not a full binary OpenType `cmap` parser. A future release can add byte-level TTF/OTF inspection for authoritative glyph coverage, font licensing flags, OpenType feature tables, and variable-axis metadata.
