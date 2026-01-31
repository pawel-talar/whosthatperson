UPDATE persons
SET hints = json_insert(
  json_insert(hints, '$[#]', 'To znana postać w swojej dziedzinie.'),
  '$[#]',
  'Jego/Jej nazwisko jest szeroko rozpoznawalne.'
)
WHERE json_array_length(hints) = 3;
