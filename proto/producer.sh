#!/bin/bash
# Sciprt to simulate "data producer"
PROFILE=592798899605_RaitaAdmin
BUCKET=s3-raita-dev-proto-data-reception

SRC_PATH=./data
ZIP_PATH=./tmp
# FILENAME=$1
ZIP_NAME=test-$(date +%s).zip
DEST_PATH=/TEST_PRODUCER_1/$(date +%Y%m%d)/
# DEST_PATH=/TEST_PRODUCER_2/$(date +%Y%m%d)/

# TODO: generate unique id?
# link image to txt file based on id?

cd $SRC_PATH
zip .$ZIP_PATH/$ZIP_NAME ./*
cd ..


SOURCE=$ZIP_PATH/$ZIP_NAME
DEST=s3://$BUCKET$DEST_PATH$ZIP_NAME

upload () {
  aws s3 cp "$SOURCE" "$DEST" --profile $PROFILE
}

upload

rm $SOURCE
