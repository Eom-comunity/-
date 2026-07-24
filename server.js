const express = require('express');
const axios = require('axios');
const cors = require('cors');
const xml2js = require('xml2js');

const app = express();
app.use(cors());
app.use(express.json());

// 환경변수에서 국립국어원 API 키를 가져옴
const API_KEY = process.env.DICT_API_KEY;

app.get('/check', async (req, res) => {
    const word = req.query.word;
    if (!word) return res.json({ success: false, reason: "단어를 입력해주세요." });

    try {
        // 국립국어원 표준국어대사전 API 호출 (XML 응답)
        const response = await axios.get(`https://stdict.korean.go.kr/api/search.do`, {
            params: {
                key: API_KEY,
                q: word,
                type1: 'word',
                pos: 1 // 명사만 검색
            }
        });

        // XML을 JSON으로 변환
        const parser = new xml2js.Parser();
        parser.parseString(response.data, (err, result) => {
            if (err || !result.channel || !result.channel.item) {
                return res.json({ success: false, reason: "사전에 없는 단어입니다." });
            }

            const items = result.channel.item;
            // 완전히 단어가 일치하는지 확인 (기호 제거 후)
            const exists = items.some(item => {
                const cleanWord = item.word[0].replace(/[\^\-\.]/g, '');
                return cleanWord === word;
            });

            if (exists) {
                return res.json({ success: true });
            } else {
                return res.json({ success: false, reason: "정확한 명사가 아닙니다." });
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, reason: "서버 오류가 발생했습니다." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
