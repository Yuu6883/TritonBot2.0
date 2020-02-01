const fetch = require("node-fetch");

/**
 * @return {Promise<{chinaTotal:{date:string,confirm:string,suspect:string,dead:string,heal:string}, lastUpdateTime: string}>}
 */
module.exports.fromQQ = async () => {
    let res  = await fetch(`https://view.inews.qq.com/g2/getOnsInfo?name=disease_h5&_=${Date.now()}`);
    /** @type {string} */
    let text = await res.text();
    let obj = JSON.parse(text);
    return JSON.parse(obj.data);
}

module.exports.fromJH = async () => {
    let recoverRes = await fetch(`https://services1.arcgis.com/0MSEUqKaxRlEPj5g/arcgis/rest/services/ncov_cases/FeatureServer/1/query?f=json&where=1%3D1&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&outStatistics=%5B%7B%22statisticType%22%3A%22sum%22%2C%22onStatisticField%22%3A%22Recovered%22%2C%22outStatisticFieldName%22%3A%22value%22%7D%5D&outSR=102100&cacheHint=true`)
    let res = await recoverRes.json();
    let recover = ~~res.features[0].attributes.value;
    let deathRes = await fetch(`https://services1.arcgis.com/0MSEUqKaxRlEPj5g/arcgis/rest/services/ncov_cases/FeatureServer/1/query?f=json&where=1%3D1&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&outStatistics=%5B%7B%22statisticType%22%3A%22sum%22%2C%22onStatisticField%22%3A%22Deaths%22%2C%22outStatisticFieldName%22%3A%22value%22%7D%5D&outSR=102100&cacheHint=true`);
    res = await deathRes.json();
    let death = ~~res.features[0].attributes.value;
    let totalRes = await fetch(`https://services1.arcgis.com/0MSEUqKaxRlEPj5g/arcgis/rest/services/ncov_cases/FeatureServer/1/query?f=json&where=1%3D1&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&outStatistics=%5B%7B%22statisticType%22%3A%22sum%22%2C%22onStatisticField%22%3A%22Confirmed%22%2C%22outStatisticFieldName%22%3A%22value%22%7D%5D&outSR=102100&cacheHint=true`);
    res = await totalRes.json();
    let total = ~~res.features[0].attributes.value;
    return { recover, death, total };
}
