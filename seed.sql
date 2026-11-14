INSERT INTO products (name, category, price, image_url, tag, stock) VALUES
  ('Kemeja Linen Senja', 'Fashion', 289000, 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?auto=format&fit=crop&w=700&q=80', 'BEST SELLER', 30),
  ('Tas Anyam Rona', 'Aksesori', 195000, 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=700&q=80', 'HANDMADE', 20),
  ('Tumbler Terra', 'Lifestyle', 149000, 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=700&q=80', 'NEW ARRIVAL', 40),
  ('Sandal Everyday', 'Fashion', 229000, 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=700&q=80', 'FAVORIT', 25),
  ('Kacamata Solara', 'Aksesori', 175000, 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=700&q=80', 'CURATED', 15),
  ('Jurnal Hari Ini', 'Lifestyle', 89000, 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=700&q=80', 'MADE WITH CARE', 50),
  ('Outer Pagi Hari', 'Fashion', 349000, 'https://images.unsplash.com/photo-1551232864-3f0890e580d9?auto=format&fit=crop&w=700&q=80', 'LIMITED', 12),
  ('Gelang Bumi', 'Aksesori', 119000, 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=700&q=80', 'HANDMADE', 18)
ON CONFLICT DO NOTHING;
