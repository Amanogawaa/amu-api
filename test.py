from supabase import create_client, Client


url: str = "https://jlzvqvqflmiafxhcqupl.supabase.co"
key: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsenZxdnFmbG1pYWZ4aGNxdXBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyNjA3MjAsImV4cCI6MjA2MTgzNjcyMH0.RUS6gjg-jEL9sBgRhU4K7eW9Hcfv1Sb9O_mstArp0vU"

supabase: Client = create_client(url, key)  

res = supabase.table('users').select('*').execute()
print(res.data)