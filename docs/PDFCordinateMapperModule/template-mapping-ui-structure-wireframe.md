# Template Mapping Master UI Structure

## UI Direction

Template Mapping should be a full-page Mapping Studio, not a modal.

The user workflow is:

```text
Select Template -> Select Mapping Page -> Map Fields On That Page -> Move Page -> Review All Pages -> Submit Whole Mapping
```

## Routes

```text
/pdf-coordinate-mapper/template-mapping
/pdf-coordinate-mapper/template-mapping/create
/pdf-coordinate-mapper/template-mapping/:id/view
/pdf-coordinate-mapper/template-mapping/:id/edit
```

## List Page

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Template Mapping Master                                      [Refresh] [Add] │
├──────────────────────────────────────────────────────────────────────────────┤
│ [All] [Approved]                                                             │
├──────────────────────────────────────────────────────────────────────────────┤
│ AG Grid                                                                      │
│                                                                              │
│ Actions | Mapping Code | Mapping Name | Template | Fields | Status | Maker   │
│ View    | MAP001       | KIM Mapping  | KIM PDF  | 28     | Pending| user1   │
│ Edit    | MAP002       | SIP Mapping  | SIP PDF  | 18     | Approved|user2   │
└──────────────────────────────────────────────────────────────────────────────┘
```

Actions:

```text
View -> /template-mapping/:id/view
Edit -> /template-mapping/:id/edit
Add  -> /template-mapping/create
Delete -> submit delete request for approval
```

## Mapping Studio Page

Updated desktop layout:

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ ← Back  Template Mapping / Create       [Header] [Validate] [Submit]           │
├──────────────────────────────────────────────────────────────────────────────┤
│ Template: [Template Select]  Mapping Code [____]  Mapping Name [__________] │
├─────┬──────────────────────────────────────────────────────────────────┬─────┤
│ P   │ CENTER PDF WORK AREA                                             │ F   │
│ a   │ ┌──────────────────────────────────────────────────────────────┐ │ i   │
│ g   │ │ PDF Toolbar                                                  │ │ e   │
│ e   │ │ [Page 2] [-] [100%] [+] [Fit] [Grid] [Overlay] [Review]      │ │ l   │
│ s   │ ├──────────────────────────────────────────────────────────────┤ │ d   │
│     │ │                                                              │ │ s   │
│ H   │ │                  Rendered PDF Page 2                         │ │     │
│ e   │ │                                                              │ │ I   │
│ a   │ │          ┌──────────────┐                                    │ │ n   │
│ d   │ │          │ InvestorName │  overlay rectangle                 │ │ s   │
│ e   │ │          └──────────────┘                                    │ │ p   │
│ r   │ │                                                              │ │ e   │
│ s   │ │          ┌─────┐                                             │ │ c   │
│     │ │          │ PAN │                                             │ │ t   │
│     │ │          └─────┘                                             │ │ o   │
│     │ │                                                              │ │ r   │
│     │ └──────────────────────────────────────────────────────────────┘ │     │
└─────┴──────────────────────────────────────────────────────────────────┴─────┘
```

The thin left and right strips are dock tabs, not permanent side panels. They work like Visual Studio `Solution Explorer` / `Git Changes`:

```text
Left dock tabs:
  Pages
  Headers
  Page Fields

Right dock tabs:
  Field Inspector
  Type Config
  Issues
  Review
```

When a user clicks a dock tab, it slides/floats over the PDF workspace. When the user clicks the PDF area, an unpinned panel collapses back to a thin tab. A pinned panel stays open until the user unpins or closes it.

Expanded panel example:

```text
┌─────┬──────────────────────────────┬─────────────────────────────────────────┐
│ P   │ Pages Panel                  │ PDF WORK AREA                            │
│ a   │ ┌──────────────────────────┐ │                                         │
│ g   │ │ Mapping Pages            │ │          Rendered PDF Page              │
│ e   │ │ ✓ Page 1  8 fields       │ │                                         │
│ s   │ │ ! Page 2  5 fields       │ │          overlay rectangles             │
│     │ │ ○ Page 4  0 fields       │ │                                         │
│ H   │ └──────────────────────────┘ │                                         │
│ e   │ [Pin] [Auto Hide] [Close]    │                                         │
└─────┴──────────────────────────────┴─────────────────────────────────────────┘
```

The `Header` button stays on the top-right command area and opens a small modal because it is information-only. It must not become a permanent rail/panel and must not be used for field mapping.

Right dock panel expanded:

```text
┌──────────────────────────────────────────────┬────────────────────────────┬─────┐
│ PDF WORK AREA                                │ Field Inspector            │ F   │
│                                              │ Field Code                 │ i   │
│ Rendered PDF Page                            │ Field Name                 │ e   │
│ Selected overlay                             │ Excel Header               │ l   │
│                                              │ Field Type                 │ d   │
│                                              │ Coordinates                │ s   │
│                                              │ Type Config                │     │
│                                              │ [Pin] [Auto Hide] [Close]  │ I   │
└──────────────────────────────────────────────┴────────────────────────────┴─────┘
```

## Why This Layout Is User Friendly

- The PDF remains the main focus in the center.
- Mapping pages, headers, and field properties are available on click without permanently consuming width.
- Users with the application side nav still get maximum PDF canvas area.
- Users can pin a panel temporarily when doing repeated work, then collapse it again.
- Field properties appear on the right only when needed.
- Users can map Page 1, then Page 2, then Page 4 without losing work.
- Save/Validate/Submit are always visible in the top bar.

## Dock Panel Behavior

Panels should support three states:

```text
Collapsed   - visible as thin vertical tab only
Expanded    - open over/next to canvas after click
Pinned      - stays open until unpinned
```

Default state:

```text
Pages panel: Expanded after template selection
Headers panel: Collapsed
Field Inspector: Collapsed until a field is selected
Issues panel: Collapsed unless validation fails
Review panel: Opens when user clicks Review or Submit
```

Click rules:

```text
Click Pages tab      -> open page navigator
Click Headers tab    -> open Excel header palette
Click Page Fields    -> open selected-page field list
Click Inspector tab  -> open selected field properties
Click Issues tab     -> open validation issues
Click PDF canvas     -> collapse unpinned panels
Pin panel            -> keep panel open while mapping
Close panel          -> collapse panel
```

Recommended panel widths:

```text
Left expanded panel: 280px to 340px
Right expanded panel: 320px to 380px
Collapsed tab strip: 36px to 44px
```

When both sides are collapsed, the PDF canvas gets almost the full workspace width.

## Page-First Mapping Interaction

### Initial State

```text
1. User selects Template.
2. System reads MAPPING_PAGE_NUMBERS from Template Master.
3. System builds page navigator.
4. System selects first mapping page by default.
5. System renders selected PDF page.
6. Header palette and draw tools become enabled.
```

If no page is selected:

```text
Disable field mapping tools.
Show message: Select a mapping page to begin.
```

## Mapping One Field

Recommended first-pass interaction:

```text
1. User selects Page 2.
2. User selects Excel header "Investor Name".
3. User selects field type "TEXT_FIELD".
4. User draws a rectangle on the PDF.
5. System creates a field on Page 2.
6. Field overlay appears on Page 2.
7. Field Inspector dock panel opens with field properties.
8. User adjusts config.
9. Store keeps the field in memory.
```

Important:

```text
Field.pageNo = selectedPageNo
```

## Switching Pages

When user clicks Page 4:

```text
1. Store keeps Page 2 fields.
2. selectedPageNo changes to 4.
3. PDF viewer renders Page 4.
4. Overlay renders only Page 4 fields.
5. Left field list changes to Page 4 fields.
```

No DB save happens on page switch.

## Review Before Submit

Review panel:

```text
┌──────────────────────────────────────────────┐
│ Mapping Review                               │
├──────────────────────────────────────────────┤
│ Template: KIM PDF Template                   │
│ Mapping Code: MAP_KIM_001                    │
│ Total Fields: 28                             │
│                                              │
│ Page 1  10 fields  Complete                 │
│ Page 2  12 fields  1 issue                  │
│ Page 4   6 fields  Complete                 │
│                                              │
│ Blocking Issues                              │
│ - Page 2: PAN field width is zero            │
└──────────────────────────────────────────────┘
```

Submit remains disabled until blocking issues are resolved.

## Component Structure

```text
template-mapping.page.ts
  List/grid route

template-mapping-workspace.page.ts
  Top command bar
  Template setup strip
  Layout shell

mapping-page-navigator.component.ts
  Mapping pages and progress

field-palette.component.ts
  Excel headers and search

pdf-viewer.component.ts
  PDF.js page rendering and zoom

coordinate-overlay.component.ts
  Draw/select/move/resize overlays

mapped-field-list.component.ts
  Fields for selected page

field-inspector.component.ts
  Common field properties
  Type-specific configuration

mapping-validation-panel.component.ts
  Page issues and full aggregate issues
```

## Store Responsibilities

```text
selectedTemplateId
mappingPages
selectedPageNo
fields
configs
selectedFieldUid
validationIssues
dirtyPageNumbers
```

Main selectors:

```text
fieldsForSelectedPage
configsForSelectedField
pageStatusList
canMapField
canSubmit
savePayload
```

Main actions:

```text
selectTemplate(templateId)
selectPage(pageNo)
selectHeader(header)
drawField(rect)
selectField(fieldUid)
moveField(fieldUid, rect)
resizeField(fieldUid, rect)
updateField(fieldUid, patch)
updateConfig(fieldUid, patch)
deleteField(fieldUid)
validatePage(pageNo)
validateAll()
submitForApproval()
```

## Save Payload Rule

Even though the user maps page by page, save must send all pages together:

```json
{
  "template_Id": "101",
  "mapping_Code": "MAP_KIM_001",
  "mapping_Name": "KIM Main Mapping",
  "coordinate_Origin": "TOP_LEFT",
  "fields": [
    { "page_No": "1", "field_Code": "INVESTOR_NAME", "x_Coordinate": "72", "y_Coordinate": "110" },
    { "page_No": "2", "field_Code": "PAN", "x_Coordinate": "80", "y_Coordinate": "210" },
    { "page_No": "4", "field_Code": "AMOUNT", "x_Coordinate": "95", "y_Coordinate": "310" }
  ]
}
```

Do not save only selected page.

## First Implementation Recommendation

Build in this order:

1. List page.
2. Workspace route shell.
3. Template selector.
4. Mapping page navigator.
5. PDF single-page render.
6. Header palette.
7. Select-header-then-draw rectangle.
8. Overlay render for selected page.
9. Field inspector.
10. Page switching with state preservation.
11. Whole mapping review.
12. Save/submit full aggregate.
