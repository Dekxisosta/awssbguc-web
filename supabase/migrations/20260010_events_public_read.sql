-- /events is a public page ("guests get a read-only view"), but the only SELECT policy on events
-- is TO authenticated. The page reads with the anon key, so signed-out visitors got an empty list
-- with no error. Events are public information, so let anon read them too.

DROP POLICY IF EXISTS "events: anyone can read all events" ON events;
 
CREATE POLICY "events: anyone can read all events"
    ON events
    FOR SELECT
    TO anon
    USING (true);