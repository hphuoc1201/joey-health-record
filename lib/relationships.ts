// Relationship of a member to the person managing the family record.
// "Bản thân" comes first because a manager usually adds themselves first.
export const RELATIONSHIPS: string[] = [
  "Bản thân",
  "Vợ",
  "Chồng",
  "Bố / Ba",
  "Mẹ",
  "Con trai",
  "Con gái",
  "Anh trai",
  "Chị gái",
  "Em trai",
  "Em gái",
  "Ông",
  "Bà",
  "Cháu",
  "Bố vợ / Bố chồng",
  "Mẹ vợ / Mẹ chồng",
  "Người thân khác",
];

export const GENDERS: { value: string; label: string }[] = [
  { value: "male", label: "Nam" },
  { value: "female", label: "Nữ" },
  { value: "other", label: "Khác" },
];
