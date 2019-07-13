const removeComments = function (rawData) {
    let re = /\\"|"(?:\\"|[^"])*"|((^|[^\\])\;((?!(#)).)*)/g
    return rawData.replace(re, function (m, g1) {
        return !g1 ? m : ""
    })
}

const flatten = function (rawData) {
    let captured = []
    let re = /\([\s\S]*?\)/gim
    let match = re.exec(rawData)
    while (match !== null) {
        match.replacement = match[0].replace(/\s+/gm, ' ')
        captured.push(match)
        match = re.exec(rawData)
    }
    let arrText = rawData.split('')
    for (match of captured) {
        arrText.splice(match.index, match[0].length, match.replacement)
    }
    return arrText.join('').replace(/\(|\)/gim, ' ')
}

const removeBlankLine = function(rawData) {
    const regex = /^(?:[\t ]*(?:\r?\n|\r))+/gm 
    return rawData.replace(regex, '')
}

const splitRecords = function(rawData) {
    let recordList = rawData.split('\n')
    if(recordList[recordList.length - 1] === '') recordList.pop()
    return recordList
}

const splitElementsOfRecords = function(rawDataList) {
    const regex = /\S+/g
    var elementList = []
    for (let index = 0; index < rawDataList.length; index++) {
        elementList.push(rawDataList[index].match(regex))
    }
    return elementList
}

const generateRecordObject = function(elementList) {
    var recordObject = {}
    elementList.forEach(recordElementList => {
        if(recordElementList[0] === '$TTL' || recordElementList[0] === '$ORIGIN') recordObject[recordElementList[0]] = recordElementList[1]            
        else {
            if(recordElementList[2] === 'SOA') 
                recordObject[recordElementList[2]] = {id: recordElementList[recordElementList.length - 1].replace("#", ''),
                                                      name: recordElementList[0],
                                                      mname: recordElementList[3],
                                                      rname: recordElementList[4],
                                                      serial: recordElementList[5],
                                                      refresh: recordElementList[6],
                                                      retry: recordElementList[7],
                                                      expire: recordElementList[8],
                                                      minimum: recordElementList[9]}
            else {
                if(!recordObject[recordElementList[2]]) recordObject[recordElementList[2]] = []
                var pattern = {id: recordElementList[recordElementList.length - 1].replace("#", ''),
                                name: recordElementList[0]}
                
                switch (recordElementList[2]) {
                    case "NS":
                        pattern = {...pattern, host: recordElementList[3] }
                        break;
                    case "MX":
                        pattern = {...pattern, host: recordElementList[4],
                                                     preference:recordElementList[3] }
                        break;
                    case "A":
                        pattern = {...pattern, host: recordElementList[3] }
                        break;
                    case "AAAA":
                        pattern = {...pattern, host: recordElementList[3] }
                        break;
                    case "CNAME":
                        pattern = {...pattern, alias: recordElementList[3] }
                        break;
                    case "TXT":
                        pattern = {...pattern, txt: recordElementList[3] }
                        break;
                    case "SRV":
                        pattern = {...pattern, target:recordElementList[6],
                                               priority:recordElementList[3],
                                               weight:recordElementList[4],
                                               port:recordElementList[5] }
                        break;
                    default:
                        throw new Error("some record is invalid in record file")
                }
                recordObject[recordElementList[2]].push(pattern)
            }
        }
    })
    return recordObject
}

var recordTemplate={mx: "{name}\tIN\tMX\t{preference}\t{host}\t ;#{id}\n",
                    ns: "{name}\tIN\tNS\t{host}\t ;#{id}\n",
                    a: "{name}\tIN\tA\t{host}\t ;#{id}\n",
                    soa: `{name}\tIN\tSOA\t{mname}\t{rname} (\n{serial}\t;serial\n{refresh}\t;refresh\n{retry}\t;retry\n{expire}\t;expire\n{minimum}\t;minimum ttl\n)\t ;#{id}\n`,
                    aaaa: "{name}\tIN\tAAAA\t{host}\t ;#{id}\n",
                    cname: "{name}\tIN\tCNAME\t{host}\t ;#{id}\n",
                    txt: "{name}\tIN\tTXT\t{txt}\t ;#{id}\n",
                    srv: "{name}\tIN\tSRV\t{priority}\t{weight}\t{port}\t{target}\t ;#{id}\n"}

const Generate = function(recordObject) {
    var pattern = "{origin}\n{ttl}\n\n; SOA Record\n{soa}\n; NS Records\n{ns}\n\n; MX Records\n{mx}\n\n; A Records\n{a}\n\n; AAAA Records\n{aaaa}\n\n; CNAME Records\n{cname}\n\n; TXT Records\n{txt}\n\n; SRV Records\n{srv}"
    for (const key in recordObject) {
        if(key === 'ttl') pattern = pattern.replace("{ttl}", `$TTL ${recordObject.ttl}`)
        if(key === 'origin') pattern = pattern.replace("{origin}", `$ORIGIN ${recordObject.origin}`)
        if(key === 'soa') {
            var template = recordTemplate[key]
            for (const keyoption in recordObject[key].Options) {
                template = template.replace(`{${keyoption}}`, recordObject[key].Options[keyoption])
            }
            pattern = pattern.replace(`{${key}}`, template)
        }else{
            var temp = ""
            Array.prototype.forEach.call(recordObject[key], record => {
                var template = recordTemplate[key]
                for (const keyoption in record.Options) {
                    template = template.replace(`{${keyoption}}`, record.Options[keyoption])
                }
                temp += template
            })
            pattern = pattern.replace(`{${key}}`, temp)
        }
    }
    pattern = pattern.replace(/(\{.*\})/gi, '')
    return pattern
}

const Parse = function(rawData) {
    return  generateRecordObject(
            splitElementsOfRecords(
            splitRecords(
            removeBlankLine(
            flatten(
            removeComments(rawData))))))
}

exports.Generate = Generate
exports.Parse = Parse
