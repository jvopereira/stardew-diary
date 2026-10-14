export const museumGroups = Object.freeze([
  ['artifact', 'Artefatos'],
  ['mineral', 'Minerais'],
]);

const normalized = (text) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();

export function filterMuseum(entries, { search = '', type = 'all', status = 'all' }, recordedIds) {
  const query = normalized(search);
  return entries.filter((entry) =>
    (!query || normalized(`${entry.namePt} ${entry.nameEn}`).includes(query)) &&
    (type === 'all' || entry.type === type) &&
    (status === 'all' || (status === 'recorded' ? recordedIds.has(entry.id) : !recordedIds.has(entry.id)))
  );
}
