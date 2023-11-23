import { parseCSVContent }  from "../../../../utils/zod-csv/zcsv";
import {amsSchema} from "./amsCsvSchema";
import {log} from "../../../../utils/logger";


function tidyUpHeaderLine(cvsHeaderLine: string):string {
  var a = cvsHeaderLine.replace(' ','_').toLowerCase();
  console.log("a: " + a );
  var b = a.replace(/\[.*?\]/g,'');
  console.log("b: " + b);

    return b;
}

function tidyUpFileBody(csvFileBody: string) {
    const firstNewLinePos = csvFileBody.search(/\r\n|\r|\n/);
  console.log("firstNewLinePos: " + firstNewLinePos);

    //trash first line; csv headears are on the second
  const bodyWithoutFirstLIne = csvFileBody.slice(firstNewLinePos+1);
  console.log("bodyWithoutFirstLIne: " + bodyWithoutFirstLIne);
    const secondNewLinePos = bodyWithoutFirstLIne.search(/\r\n|\r|\n/);
  console.log("secondNewLinePos: " + secondNewLinePos);
    const cvsHeaderLine = bodyWithoutFirstLIne.slice(0, secondNewLinePos);
  console.log("cvsHeaderLine: " + cvsHeaderLine);

    const cvsDataLines = bodyWithoutFirstLIne.slice(secondNewLinePos);
  console.log("cvsDataLines: " + cvsDataLines);


  var b = tidyUpHeaderLine(cvsHeaderLine);
  console.log("tidyHeaderLine: " + b);

    return tidyUpHeaderLine(cvsHeaderLine).concat(cvsDataLines);
}

export async function parseAMSCSVData(csvFileBody: string){
    const tidyedFileBody = tidyUpFileBody(csvFileBody);
    console.log(tidyedFileBody);

   var a = parseCSVContent(tidyedFileBody, amsSchema);
   console.log("parsed data: " + a);
  console.log(a);


}
