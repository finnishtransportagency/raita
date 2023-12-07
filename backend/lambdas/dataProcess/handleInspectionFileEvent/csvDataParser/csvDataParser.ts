import {IFileResult} from "../../../../types";
import {log} from "../../../../utils/logger";
import {parseAMSCSVData} from "./amsCsvDataParser";

export async function parseCSVData(fileBaseName: string, file: IFileResult)  {
    const fileNameParts = fileBaseName.split('_');
    const fileNamePrefix = fileNameParts[0];

    switch (fileNamePrefix){
        case 'AMS':
            file.fileBody && await parseAMSCSVData(file.fileBody);
            break;
        default:
            log.warn('Unknown csv file prefix: ' + fileNamePrefix);
            return 'fail';
    }
    return 'success';

}
