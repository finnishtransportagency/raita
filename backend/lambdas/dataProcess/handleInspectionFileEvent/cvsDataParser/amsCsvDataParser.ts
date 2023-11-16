import { zcsv, parseCSVContent, parseCSV } from "zod-csv";
import { z } from "zod";
import {IFileResult} from "../../../../types";

function tidyUpHeaderLine(cvsHeaderLine: string):string {
    return cvsHeaderLine.replace(' ','_').toLowerCase().replace(/\[.*\]/,'');
}

function tidyUpFileBody(csvFileBody: string) {
    const firstNewLinePos = csvFileBody.search(/\r\n|\r|\n/);
    //trash first line; csv headears are on the second
    const secondNewLinePos = csvFileBody.slice(firstNewLinePos).search(/\r\n|\r|\n/);

    const cvsHeaderLine = csvFileBody.slice(firstNewLinePos, secondNewLinePos);
    const cvsDataLines = csvFileBody.slice(secondNewLinePos);

    return tidyUpHeaderLine(cvsHeaderLine).concat(cvsDataLines);
}

export async function parseAMSCSVData(csvFileBody: string){
    const tidyedFileBody = tidyUpFileBody(csvFileBody);


}
