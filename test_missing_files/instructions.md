# Instructions for checking and rerunning missing files in database

## Fetch list of all files in s3 to a file.

- Run `AWS_PROFILE=<profile> S3_BUCKET=<inspectionBucket> node ./list-all-s3-keys.js > ./data/all_in_s3.txt` in this directory
- Replace env vars with correct ones
- Runtime ~15 mins

## Open db connection via bastion machine

- Log into bastion host via SSM
- Run `sudo socat TCP4-LISTEN:5432,reuseaddr,fork TCP:<database_url>:5432` on bastion machine
- Run `INSTANCE_ID=<bastion_instance_id> PROFILE=<aws_profile> ./bastion-postgresql-connection-pipe.sh

## Fetch list of files in postgres

- Run `psql --host=localhost --port=5432 --dbname=raita --user=raita -c "select key from main.raportti;" > ./data/all_in_postgres.txt`
- note: set dbname, user, schema based on needs
- Runtime 5-10mins

## Get lists of missing keys

- Run `/compare_missing_files.sh`
- Script will output files that are present in s3 but not in postgres, in separately named files in ./data directory
- Runtime: a couple hours(?)
- Comment out parts of the script if not all file types are needed

## Rerun missing files in data process for each file type

- Run `AWS_PROFILE=<profile> S3_BUCKET=<inspection_bucket> INPUT_FILE=./data/csv_missing_in_postgres node ./rerun-s3.js`
- Set env vars and input file name as needed
- Runtime: depends on file count
