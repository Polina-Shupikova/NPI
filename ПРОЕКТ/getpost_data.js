const fs = require('fs');

async function get(url) {
    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log("Данные получены:", data);
        return data;
    } catch (error) {
        console.log("Ошибка при загрузке JSON:", error);
    }
}


async function post(url, data) {
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        const result = await response.json();
        console.log("Данные отправлены:", result);
    } catch (error) {
        console.log("Ошибка при отправке JSON:", error);
    }
}
