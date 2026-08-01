# Dynamic PDF Injection + Batch Print TODO

## Status

- [x] Updated print-contract implementation started
- [ ] Updated print-contract implementation completed

## Checklist

- [x] 1. Add binary-safe PDF validation utility for `ArrayBuffer` / `Uint8Array` uploads
- [x] 2. Enforce `%PDF-` signature validation before PDF rendering or generation
- [x] 3. Align shared schema/types to `Text`, `OptionGroup`, and `CharGrid`
- [x] 4. Replace exported `pages` contract with updated `pageSize` contract
- [x] 5. Refactor `CharBox` state/export into `CharGrid.config { startX, startY, boxSpacing, maxBoxes }`
- [x] 6. Refactor `Choice` state/export into `OptionGroup.options { value, x, y }[]`
- [x] 7. Update mapper state/service to use the renamed field models everywhere
- [x] 8. Update mapper UI labels, forms, and creation flow for `Text`, `OptionGroup`, and `CharGrid`
- [x] 9. Rename CharBox preview/count editing to CharGrid box spacing / max boxes
- [x] 10. Add NFO-friendly defaults for Folio No, PAN, Unit Holding, and Bank Account
- [x] 11. Add single-source-page selection or validation for batch generation
- [x] 12. Update Excel parsing flow to support updated validation against the new mapping contract
- [x] 13. Refactor PDF generation service to render `Text` with the updated schema
- [x] 14. Refactor PDF generation service to render `CharGrid` using `startX + index * boxSpacing`
- [x] 15. Refactor PDF generation service to render `OptionGroup` by exact option match
- [x] 16. Keep top-left UI coordinates and centralize PDF Y-flip conversion in generator utilities
- [x] 17. Update preview/download/print workflow to reflect single-page-per-row generation assumptions
- [x] 18. Add validation and warning reporting for malformed PDFs, missing headers, unmatched options, and invalid configs
- [x] 19. Update unit tests for schema shape, coordinate conversion, PDF signature checks, and field rendering
- [x] 20. Update integration tests for upload, mapping export, generation, and output page counts
- [ ] 21. Run build/tests and complete manual QA with the sample PDF and Excel files

## Notes

- Use `FileReader.readAsArrayBuffer(file)` semantics for browser uploads.
- Any API-based PDF fetch must use `responseType: 'arraybuffer'`.
- Validate uploaded PDF bytes by checking the first 5 bytes equal `%PDF-`.
- UI coordinates remain top-left.
- PDF coordinates must be converted with `PDF_Y = Page_Height - UI_Y`.
- Batch generation v1 should produce one output page per Excel row unless multi-page behavior is explicitly added later.
- `OptionGroup` should render only the matched option and leave blank when there is no match.
- `CharGrid` must cap rendering to `maxBoxes`.

## Open Questions / Warnings

- The current app already supports multi-page template generation; this updated contract appears to prefer single-page-per-row output, so the implementation should either restrict generation to one source page or make page selection explicit.
- The updated context uses `pageSize` instead of the current per-page metadata; if future templates must support multiple distinct page sizes, this contract may need another revision.
- `npm run build` and `npm test -- --watch=false --browsers=ChromeHeadless` pass; interactive manual QA with the sample PDF/XLSX is still pending.
