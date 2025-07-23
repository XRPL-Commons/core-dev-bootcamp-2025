import { 
    encodeNodePublic
} from 'xrpl'

console.log((encodeNodePublic(Buffer.from('eda33829e19430985083274aaa992eb5b6d56dcef0c10320f0730647180b01f138', 'hex'))));
