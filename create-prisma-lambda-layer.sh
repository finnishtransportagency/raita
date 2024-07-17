#!/bin/bash

OUTPUT=/asset-output

# this path is checked by lambda node env for additional modules https://docs.aws.amazon.com/lambda/latest/dg/packaging-layers.html
OUTPUT_NODE_MODULES=nodejs/node_modules

mkdir $OUTPUT/nodejs
mkdir $OUTPUT/nodejs/node_modules
cp -r node_modules/@prisma $OUTPUT/$OUTPUT_NODE_MODULES
# TODO: not sure if the .prisma directory is needed
cp -r node_modules/.prisma $OUTPUT/$OUTPUT_NODE_MODULES
# remove unused engine files TODO: there are still multiple copies of the used engine? can be trimmed down if needed
rm -r $OUTPUT/$OUTPUT_NODE_MODULES/@prisma/engines/*debian*
rm -f $OUTPUT/$OUTPUT_NODE_MODULES/.prisma/client/*debian*
