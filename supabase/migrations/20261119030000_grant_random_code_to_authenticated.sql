-- Creating an invitation fills its share code from random_code(10), a column default that runs as the
-- signed-in user. The function had lost its EXECUTE grant, so every insert failed with
-- "permission denied for function random_code" and the dashboard said "We could not create that invitation".
-- It only generates a random string, so granting it is safe.
grant execute on function public.random_code(integer) to authenticated;
