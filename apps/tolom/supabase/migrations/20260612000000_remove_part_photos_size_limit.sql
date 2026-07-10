-- Remove 5MB size limit from part-photos bucket
-- Client-side compression handles sizing now
update storage.buckets
set file_size_limit = null
where id = 'part-photos';
