-- Normalize an old free-typed hospital name onto the canonical suggestion.
-- Existing visits had been saved as "Bệnh viện đa khoa Tâm Anh"; the visit form
-- merges any name already used in visits into the dropdown, so that old value
-- showed up as a duplicate next to the built-in "BV Đa khoa Tâm Anh TP.HCM".
-- Point every such row at the canonical name so the duplicate disappears.
update public.visits
set hospital = 'BV Đa khoa Tâm Anh TP.HCM'
where hospital = 'Bệnh viện đa khoa Tâm Anh';
