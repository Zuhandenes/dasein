const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

    // Обработка формы записи
    if (req.method === 'POST' && req.url === '/api/book') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                
                // Валидация данных
                if (!data.name || !data.contact) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Имя и контакты обязательны' }));
                    return;
                }

                // Логирование заявки (в реальном проекте здесь была бы отправка в БД или на email)
                console.log('\n=== НОВАЯ ЗАЯВКА ===');
                console.log(`Дата: ${new Date().toLocaleString('ru-RU')}`);
                console.log(`Имя: ${data.name}`);
                console.log(`Контакты: ${data.contact}`);
                console.log(`Услуга: ${data.service || 'Не выбрана'}`);
                console.log(`Комментарий: ${data.message || 'Нет'}`);
                console.log('===================\n');

                // Сохранение заявки в файл
                const bookingsFile = path.join(__dirname, 'bookings.json');
                let bookings = [];
                
                if (fs.existsSync(bookingsFile)) {
                    try {
                        bookings = JSON.parse(fs.readFileSync(bookingsFile, 'utf8'));
                    } catch (e) {
                        bookings = [];
                    }
                }

                bookings.push({
                    id: Date.now(),
                    date: new Date().toISOString(),
                    ...data
                });

                fs.writeFileSync(bookingsFile, JSON.stringify(bookings, null, 2));

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: true, 
                    message: 'Заявка успешно отправлена! Я свяжусь с вами в ближайшее время.' 
                }));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Ошибка обработки данных' }));
            }
        });
        return;
    }

    // Обработка GET запросов
    let filePath = req.url === '/' ? '/index.html' : req.url;
    
    // Защита от выхода за пределы директории
    if (filePath.includes('..')) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    filePath = path.join(__dirname, filePath);
    const extname = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('Файл не найден');
            } else {
                res.writeHead(500);
                res.end('Ошибка сервера');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

server.listen(PORT, () => {
    console.log(`\n🚀 Сервер запущен!`);
    console.log(`📍 Адрес: http://localhost:${PORT}`);
    console.log(`📁 Директория: ${__dirname}`);
    console.log(`\nДля остановки нажмите Ctrl+C\n`);
});
