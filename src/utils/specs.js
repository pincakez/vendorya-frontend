// Category spec sets (s168, PROLINE-PARITY Upgrade 9) — shared by both product edit forms.

// The server's spec errors (ProductWriteSerializer._check_spec_values) worded in the reader's language.
export function specSaveError(d, t) {
  if (d?.missing_specs?.length) return t('inventory.specs.err_missing', { names: d.missing_specs.join(', ') })
  if (d?.not_a_number?.[0]) return t('inventory.specs.err_number', { name: d.not_a_number[0] })
  return ''
}

// The attributes payload for a product save. On EDIT a blank value is sent too, so clearing a field
// really clears it (the server deletes a blank one); on CREATE blanks are skipped.
export function attributesPayload(attrs, isEdit) {
  return Object.entries(attrs || {})
    .filter(([, v]) => isEdit || (v !== '' && v != null))
    .map(([definition, value]) => ({ definition, value: value == null ? '' : value }))
}
