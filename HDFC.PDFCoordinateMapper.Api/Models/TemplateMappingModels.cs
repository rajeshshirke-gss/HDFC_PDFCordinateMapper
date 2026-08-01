using System.Collections.Generic;
using Newtonsoft.Json;

namespace HDFC.PDFCoordinateMapper.Api.Models
{
    public sealed class TemplateMappingRequest
    {
        [JsonProperty("flag")]
        public string Flag { get; set; }
        [JsonProperty("auto_Id")]
        public string Auto_Id { get; set; }
        [JsonProperty("mst_Col_Id")]
        public string Mst_Col_Id { get; set; }
        [JsonProperty("template_Id")]
        public string Template_Id { get; set; }
        [JsonProperty("mapping_Code")]
        public string Mapping_Code { get; set; }
        [JsonProperty("mapping_Name")]
        public string Mapping_Name { get; set; }
        [JsonProperty("mapping_Description")]
        public string Mapping_Description { get; set; }
        [JsonProperty("page_Width")]
        public string Page_Width { get; set; }
        [JsonProperty("page_Height")]
        public string Page_Height { get; set; }
        [JsonProperty("coordinate_Origin")]
        public string Coordinate_Origin { get; set; }
        [JsonProperty("isActive")]
        public string IsActive { get; set; }
        [JsonProperty("currentUserId")]
        public string CurrentUserId { get; set; }
        [JsonProperty("remark")]
        public string Remark { get; set; }
        [JsonProperty("fields")]
        public List<TemplateMappingFieldRequest> Fields { get; set; }
    }

    public sealed class TemplateMappingFieldRequest
    {
        [JsonProperty("autoId")]
        public string Auto_Id { get; set; }
        [JsonProperty("mstColId")]
        public string Mst_Col_Id { get; set; }
        [JsonProperty("fieldUid")]
        public string Field_Uid { get; set; }
        [JsonProperty("fieldCode")]
        public string Field_Code { get; set; }
        [JsonProperty("fieldName")]
        public string Field_Name { get; set; }
        [JsonProperty("excelHeaderName")]
        public string Excel_Header_Name { get; set; }
        [JsonProperty("fieldType")]
        public string Field_Type { get; set; }
        [JsonProperty("pageNo")]
        public string Page_No { get; set; }
        [JsonProperty("xCoordinate")]
        public string X_Coordinate { get; set; }
        [JsonProperty("yCoordinate")]
        public string Y_Coordinate { get; set; }
        [JsonProperty("fieldWidth")]
        public string Field_Width { get; set; }
        [JsonProperty("fieldHeight")]
        public string Field_Height { get; set; }
        [JsonProperty("isRequired")]
        public string Is_Required { get; set; }
        [JsonProperty("snapToGrid")]
        public string Snap_To_Grid { get; set; }
        [JsonProperty("sampleValue")]
        public string Sample_Value { get; set; }
        [JsonProperty("displaySequence")]
        public string Display_Sequence { get; set; }
        [JsonProperty("isRepeatable")]
        public string Is_Repeatable { get; set; }
        [JsonProperty("repeatGroupCode")]
        public string Repeat_Group_Code { get; set; }
        [JsonProperty("isRepeatGroupOwner")]
        public string Is_Repeat_Group_Owner { get; set; }
        [JsonProperty("isActive")]
        public string IsActive { get; set; }
        [JsonProperty("configs")]
        public List<TemplateMappingFieldConfigRequest> Configs { get; set; }
    }

    public sealed class TemplateMappingFieldConfigRequest
    {
        [JsonProperty("autoId")]
        public string Auto_Id { get; set; }
        [JsonProperty("mstColId")]
        public string Mst_Col_Id { get; set; }
        [JsonProperty("configSequence")]
        public string Config_Sequence { get; set; }
        [JsonProperty("fontName")]
        public string Font_Name { get; set; }
        [JsonProperty("fontSize")]
        public string Font_Size { get; set; }
        [JsonProperty("minFontSize")]
        public string Min_Font_Size { get; set; }
        [JsonProperty("fontStyle")]
        public string Font_Style { get; set; }
        [JsonProperty("fontColor")]
        public string Font_Color { get; set; }
        [JsonProperty("textAlignment")]
        public string Text_Alignment { get; set; }
        [JsonProperty("verticalAlignment")]
        public string Vertical_Alignment { get; set; }
        [JsonProperty("isMultiline")]
        public string Is_Multiline { get; set; }
        [JsonProperty("maxLines")]
        public string Max_Lines { get; set; }
        [JsonProperty("lineHeight")]
        public string Line_Height { get; set; }
        [JsonProperty("maxCharacters")]
        public string Max_Characters { get; set; }
        [JsonProperty("wrapText")]
        public string Wrap_Text { get; set; }
        [JsonProperty("overflowAction")]
        public string Overflow_Action { get; set; }
        [JsonProperty("boxWidth")]
        public string Box_Width { get; set; }
        [JsonProperty("boxHeight")]
        public string Box_Height { get; set; }
        [JsonProperty("boxSpacing")]
        public string Box_Spacing { get; set; }
        [JsonProperty("maxBoxes")]
        public string Max_Boxes { get; set; }
        [JsonProperty("dateFormat")]
        public string Date_Format { get; set; }
        [JsonProperty("dateSeparator")]
        public string Date_Separator { get; set; }
        [JsonProperty("ignoreDateSeparator")]
        public string Ignore_Date_Separator { get; set; }
        [JsonProperty("selectionMode")]
        public string Selection_Mode { get; set; }
        [JsonProperty("optionValue")]
        public string Option_Value { get; set; }
        [JsonProperty("optionLabel")]
        public string Option_Label { get; set; }
        [JsonProperty("optionXCoordinate")]
        public string Option_X_Coordinate { get; set; }
        [JsonProperty("optionYCoordinate")]
        public string Option_Y_Coordinate { get; set; }
        [JsonProperty("optionWidth")]
        public string Option_Width { get; set; }
        [JsonProperty("optionHeight")]
        public string Option_Height { get; set; }
        [JsonProperty("markValue")]
        public string Mark_Value { get; set; }
        [JsonProperty("repeatSlotNo")]
        public string Repeat_Slot_No { get; set; }
        [JsonProperty("repeatXOffset")]
        public string Repeat_X_Offset { get; set; }
        [JsonProperty("repeatYOffset")]
        public string Repeat_Y_Offset { get; set; }
        [JsonProperty("computedExpression")]
        public string Computed_Expression { get; set; }
        [JsonProperty("outputFormat")]
        public string Output_Format { get; set; }
        [JsonProperty("isActive")]
        public string IsActive { get; set; }
    }
}
