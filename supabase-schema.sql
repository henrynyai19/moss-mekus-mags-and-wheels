create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  price text not null,
  details text not null,
  status text not null default 'available',
  image_url text,
  created_at timestamptz not null default now()
);

alter table public.inventory_items enable row level security;

drop policy if exists "Public inventory read" on public.inventory_items;
create policy "Public inventory read"
on public.inventory_items for select
using (true);

drop policy if exists "Public inventory insert" on public.inventory_items;
create policy "Public inventory insert"
on public.inventory_items for insert
with check (true);

drop policy if exists "Public inventory update" on public.inventory_items;
create policy "Public inventory update"
on public.inventory_items for update
using (true)
with check (true);

drop policy if exists "Public inventory delete" on public.inventory_items;
create policy "Public inventory delete"
on public.inventory_items for delete
using (true);

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Public product images read" on storage.objects;
create policy "Public product images read"
on storage.objects for select
using (bucket_id = 'product-images');

drop policy if exists "Public product images upload" on storage.objects;
create policy "Public product images upload"
on storage.objects for insert
with check (bucket_id = 'product-images');

drop policy if exists "Public product images update" on storage.objects;
create policy "Public product images update"
on storage.objects for update
using (bucket_id = 'product-images')
with check (bucket_id = 'product-images');

drop policy if exists "Public product images delete" on storage.objects;
create policy "Public product images delete"
on storage.objects for delete
using (bucket_id = 'product-images');
