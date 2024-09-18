#!/bin/bash

# This script will compare file (key) list from s3 and postgres and output files that are in s3 but missing from postgres
# If any of the files are already present, they will be emptied

DATAFOLDER=./data

ALL_IN_S3=$DATAFOLDER/all_in_s3.txt
ALL_IN_POSTGRES=$DATAFOLDER/all_in_postgres.txt
CSV_IN_S3=$DATAFOLDER/csv_in_s3.txt
CSV_IN_POSTGRES=$DATAFOLDER/csv_in_postgres.txt
TXT_IN_S3=$DATAFOLDER/txt_in_s3.txt
TXT_IN_POSTGRES=$DATAFOLDER/txt_in_postgres.txt
PDF_IN_S3=$DATAFOLDER/pdf_in_s3.txt
PDF_IN_POSTGRES=$DATAFOLDER/pdf_in_postgres.txt
XLS_IN_S3=$DATAFOLDER/xls_in_s3.txt
XLS_IN_POSTGRES=$DATAFOLDER/xls_in_postgres.txt

CSV_MISSING_IN_POSTGRES=$DATAFOLDER/csv_missing_in_postgres.txt
TXT_MISSING_IN_POSTGRES=$DATAFOLDER/txt_missing_in_postgres.txt
PDF_MISSING_IN_POSTGRES=$DATAFOLDER/pdf_missing_in_postgres.txt
XLS_MISSING_IN_POSTGRES=$DATAFOLDER/xls_missing_in_postgres.txt

grep ".csv" $ALL_IN_S3 > $CSV_IN_S3
grep ".csv" $ALL_IN_POSTGRES > $CSV_IN_POSTGRES

grep ".txt" $ALL_IN_S3 > $TXT_IN_S3
grep ".txt" $ALL_IN_POSTGRES > $TXT_IN_POSTGRES

grep ".pdf" $ALL_IN_S3 > $PDF_IN_S3
grep ".pdf" $ALL_IN_POSTGRES > $PDF_IN_POSTGRES

grep ".xls" $ALL_IN_S3 > $XLS_IN_S3
grep ".xls" $ALL_IN_POSTGRES > $XLS_IN_POSTGRES


compare () {
  INFILE=$1
  CMPFILE=$2
  OUTFILE=$3
  > $OUTFILE
  while IFS= read -r LINE
  do
    NAME_IF_FOUND=$(grep "$LINE" $CMPFILE)
    if [[ -z "$NAME_IF_FOUND" ]]; then
      echo "$LINE" >> $OUTFILE
    fi
  done < "$INFILE"
}

compare $CSV_IN_S3 $CSV_IN_POSTGRES $CSV_MISSING_IN_POSTGRES
echo "csv done"
compare $TXT_IN_S3 $TXT_IN_POSTGRES $TXT_MISSING_IN_POSTGRES
echo "txt done"
compare $PDF_IN_S3 $PDF_IN_POSTGRES $PDF_MISSING_IN_POSTGRES
echo "pdf done"
compare $XLS_IN_S3 $XLS_IN_POSTGRES $XLS_MISSING_IN_POSTGRES
echo "xls done"
