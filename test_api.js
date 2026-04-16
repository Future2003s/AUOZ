// just use global fetch
async function test() {
    try {
        const res = await fetch("http://localhost:3000/api/products/public?size=7&locale=ja");
        const d = await res.json();
        const juices = d.data.filter(p => p.name.includes("ジュース") || p.name.includes("Nước") || p.name.includes("Tàu Lai"));
        console.log(JSON.stringify(juices, null, 2));
    } catch (err) {
        console.error(err);
    }
}
test();
