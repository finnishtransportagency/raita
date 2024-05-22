#!/bin/bash

# create schema.prisma file from migration files

PASSWORD=LOCALUSEONLY
PORT=54321
MIGRATION_PATH=backend/db/migration
CONTAINER_NAME=raitapostgis
SCHEMA_FILE=backend/db/prisma/schema.prisma

sudo docker run --detach --name $CONTAINER_NAME --rm -e POSTGRES_PASSWORD=$PASSWORD -p 127.0.0.1:$PORT:5432 postgis/postgis

# wait until container is up
# TODO: better way to do this
sleep 20

FILES=$(ls -v $MIGRATION_PATH)
for FILE in $FILES
do
  PGPASSWORD=$PASSWORD psql --host=127.0.0.1 --port=$PORT --dbname=postgres --user=postgres -f $MIGRATION_PATH/$FILE
done

DATABASE_URL=postgresql://postgres:$PASSWORD@localhost:$PORT/postgres npx prisma db pull --schema=$SCHEMA_FILE
sudo docker stop raitapostgis
