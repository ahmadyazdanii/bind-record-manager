const fs = require("fs")

class RecordManager {
    constructor(recordFilePath = undefined) {
        this.recordFilePath = recordFilePath
        this.rawData = undefined
        this.rawDataList = undefined
        this.parsedData = undefined
        this.removeCommentsRegex = /\\"|"(?:\\"|[^"])*"|((^|[^\\])\;((?!(#)).)*)/g
        this.removeBlankLineRegex = /^(?:[\t ]*(?:\r?\n|\r))+/gm
        this.splitByNewLineStr = '\r'
        //
        this.recordTemplate = {
            mx: "{name}\tIN\tMX\t{preference}\t{host}\t ;#{id}\n",
            ns: "{name}\tIN\tNS\t{host}\t ;#{id}\n",
            a: "{name}\tIN\tA\t{host}\t ;#{id}\n",
            soa: `{name}\tIN\tSOA\t{mname}\t{rname} (\n{serial}\t;serial\n{refresh}\t;refresh\n{retry}\t;retry\n{expire}\t;expire\n{minimum}\t;minimum ttl\n)\t ;#{id}\n`,
            aaaa: "{name}\tIN\tAAAA\t{host}\t ;#{id}\n",
            cname: "{name}\tIN\tCNAME\t{host}\t ;#{id}\n",
            txt: "{name}\tIN\tTXT\t{txt}\t ;#{id}\n",
            srv: "{name}\tIN\tSRV\t{priority}\t{weight}\t{port}\t{target}\t ;#{id}\n"
        }
        this.generatorPattern = "{origin}\n{ttl}\n\n; SOA Record\n{soa}\n; NS Records\n{ns}\n\n; MX Records\n{mx}\n\n; A Records\n{a}\n\n; AAAA Records\n{aaaa}\n\n; CNAME Records\n{cname}\n\n; TXT Records\n{txt}\n\n; SRV Records\n{srv}"
    }

    setRawData(rawData = undefined) {
        this.rawData = rawData ? rawData : fs.readFileSync(this.recordFilePath, 'utf-8')
    }

    getRawData() {
        return this.rawData
    }

    setRemoveCommentsRegex(regex) {
        this.removeCommentsRegex = regex
    }

    getRemoveCommentsRegex() {
        return this.removeCommentsRegex
    }

    getRemoveBlankLineRegex() {
        return this.removeBlankLineRegex
    }

    setRemoveBlankLineRegex(regex) {
        this.removeBlankLineRegex = regex
    }

    setSplitByNewLineStr(str) {
        this.splitByNewLineStr = str;
    }

    getSplitByNewLineStr() {
        return this.splitByNewLineStr;
    }

    setRawDataList(list) {
        this.rawDataList = list
    }

    getRawDataList() {
        return this.rawDataList
    }

    setParsedData(object) {
        this.parsedData = object
    }

    getParsedData() {
        return this.parsedData
    }

    getRecordTemplate() {
        return this.recordTemplate
    }

    setRecordTemplate(object) {
        this.recordTemplate = object
    }

    getGeneratorPattern() {
        return this.generatorPattern
    }

    setGeneratorPattern(string) {
        this.generatorPattern = string
    }

    removeComments() {
        let changed = this.getRawData().replace(this.getRemoveCommentsRegex(), function (manual, pat) {
            return !pat ? manual : ""
        })
        this.setRawData(changed)
    }

    flatten() {
        let captured = []
        let regex = /\([\s\S]*?\)/gim
        let match = regex.exec(this.getRawData())
        while (match !== null) {
            match.replacement = match[0].replace(/\s+/gm, ' ')
            captured.push(match)
            match = regex.exec(this.getRawData())
        }
        let arrText = this.getRawData().split('')
        for (match of captured) {
            arrText.splice(match.index, match[0].length, match.replacement)
        }
        this.setRawData(arrText.join('').replace(/\(|\)/gim, ' '))
    }

    removeBlankLine() {
        this.setRawData(this.getRawData().replace(this.getRemoveBlankLineRegex(), ''))
    }

    splitRecords() {
        let recordList = this.getRawData().split(this.getSplitByNewLineStr())
        if (recordList[recordList.length - 1] === '') recordList.pop()
        this.setRawDataList(recordList)
    }

    splitElementsOfRecords() {
        const regex = /\S+/g
        var rawDatalist = this.getRawDataList()
        var elementList = []
        for (let index = 0; index < rawDatalist.length; index++) {
            elementList.push(rawDatalist[index].match(regex))
        }
        this.setRawDataList(elementList)
    }

    generateRecordObject() {
        var recordObject = {}
        this.getRawDataList().forEach(recordElementList => {
            if (recordElementList[0] === '$TTL' || recordElementList[0] === '$ORIGIN')
                recordObject[recordElementList[0]] = recordElementList[1]
            else {
                if (recordElementList[2] === 'SOA')
                    recordObject[recordElementList[2].toLowerCase()] = {
                        Options: {
                            id: recordElementList[recordElementList.length - 1].replace("#", ''),
                            name: recordElementList[0],
                            mname: recordElementList[3],
                            rname: recordElementList[4],
                            serial: recordElementList[5],
                            refresh: recordElementList[6],
                            retry: recordElementList[7],
                            expire: recordElementList[8],
                            minimum: recordElementList[9]
                        }
                    }
                else {
                    if (!recordObject[recordElementList[2].toLowerCase()]) recordObject[recordElementList[2].toLowerCase()] = []
                    var pattern = {
                        id: recordElementList[recordElementList.length - 1].replace("#", ''),
                        name: recordElementList[0]
                    }

                    switch (recordElementList[2]) {
                        case "NS":
                            pattern = { Options: { ...pattern, host: recordElementList[3] } }
                            break;
                        case "MX":
                            pattern = {
                                Options: {
                                    ...pattern, host: recordElementList[4],
                                    preference: recordElementList[3]
                                }
                            }
                            break;
                        case "A":
                            pattern = { Options: { ...pattern, host: recordElementList[3] } }
                            break;
                        case "AAAA":
                            pattern = { Options: { ...pattern, host: recordElementList[3] } }
                            break;
                        case "CNAME":
                            pattern = { Options: { ...pattern, alias: recordElementList[3] } }
                            break;
                        case "TXT":
                            pattern = { Options: { ...pattern, txt: recordElementList[3] } }
                            break;
                        case "SRV":
                            pattern = {
                                Options: {
                                    ...pattern, target: recordElementList[6],
                                    priority: recordElementList[3],
                                    weight: recordElementList[4],
                                    port: recordElementList[5]
                                }
                            }
                            break;
                        default:
                            throw new Error("some record is invalid in record file")
                    }
                    recordObject[recordElementList[2].toLowerCase()].push(pattern)
                }
            }
        })
        this.setParsedData(recordObject)
    }

    Parse(dataRaw = undefined) {
        if (dataRaw) this.setRawData(dataRaw)
        else this.setRawData()
        this.removeComments()
        this.flatten()
        this.removeBlankLine()
        this.splitRecords()
        this.splitElementsOfRecords()
        this.generateRecordObject()
        return this.getParsedData()
    }

    Generate(recordObject) {
        if (!recordObject || typeof recordObject !== "object") throw new Error("invalid Generate function input")
        var pattern = this.getGeneratorPattern()
        for (const key in recordObject) {
            if (key === 'ttl') pattern = pattern.replace("{ttl}", `$TTL ${recordObject.ttl}`)
            if (key === 'origin') pattern = pattern.replace("{origin}", `$ORIGIN ${recordObject.origin}`)
            if (key === 'soa') {
                var template = this.getRecordTemplate()[key]
                for (const keyoption in recordObject[key].Options) {
                    template = template.replace(`{${keyoption}}`, recordObject[key].Options[keyoption])
                }
                pattern = pattern.replace(`{${key}}`, template)
            } else {
                var temp = ""
                Array.prototype.forEach.call(recordObject[key], record => {
                    var template = this.getRecordTemplate()[key]
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
}

module.exports = RecordManager
module.exports.RecordManager = RecordManager
module.exports.default = RecordManager
