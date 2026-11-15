-- Outfit4Today – Crew-Auswahl pro Teil serverseitig durchsetzen
-- Im Supabase SQL Editor einfügen und ausführen. Mehrfaches Ausführen ist unkritisch.
--
-- Hintergrund: visibility.crewIds (jsonb-Array von Crew-IDs) legt fest, welche Crews ein Teil sehen.
-- Leer/fehlend = alle Crews des Besitzers (Verhalten wie bisher).
-- Die App filtert das bereits in der Anzeige; erst mit dieser Policy liefert die Datenbank
-- ein Teil auch technisch nur noch an Mitglieder der ausgewählten Crews aus.

drop policy if exists "wardrobe_items_select_shared" on public.wardrobe_items;
create policy "wardrobe_items_select_shared" on public.wardrobe_items
  for select to authenticated using (
    user_id <> auth.uid()
    and coalesce((visibility::jsonb ->> 'isPrivate')::boolean, false) = false
    and (
      coalesce((visibility::jsonb ->> 'onMarketplace')::boolean, false)
      or (
        coalesce((visibility::jsonb ->> 'sharedWithCrew')::boolean, false)
        and (
          case
            when jsonb_typeof(visibility::jsonb -> 'crewIds') = 'array'
                 and jsonb_array_length(visibility::jsonb -> 'crewIds') > 0
            then exists (
              select 1
              from jsonb_array_elements_text(visibility::jsonb -> 'crewIds') as c(id)
              where public.is_crew_member(c.id::uuid)
            )
            else public.shares_crew_with(user_id)
          end
        )
      )
    )
  );
