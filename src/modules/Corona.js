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