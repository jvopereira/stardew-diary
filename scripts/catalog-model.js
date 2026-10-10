export const seasonGroups = Object.freeze([
  ['spring', 'Primavera'],
  ['summer', 'Verão'],
  ['fall', 'Outono'],
  ['winter', 'Inverno'],
  ['year-round', 'O ano todo'],
  ['unverified', 'Outros'],
]);

export function seasonGroupFor(entry) {
  if (!entry.seasons) return ['unverified'];
  if (entry.seasons.length === 4) return ['year-round'];
  return entry.seasons;
}

export function filterCatalog(entries, { search = '', season = 'all', method = 'all', status = 'all' }, recordedIds) {
  const query = search.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();
  return entries.filter((entry) => {
    const names = `${entry.namePt} ${entry.nameEn}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
    const recorded = recordedIds.has(entry.id);
    return (!query || names.includes(query)) &&
      (season === 'all' || seasonGroupFor(entry).includes(season)) &&
      (method === 'all' || entry.method === method) &&
      (status === 'all' || (status === 'recorded' ? recorded : !recorded));
  });
}
