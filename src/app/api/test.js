// api/test.js
module.exports = (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({ message: 'API route is working!' });
};