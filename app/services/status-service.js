module.exports = class Status {
  constructor(router) {
    this.router = router;
  }

  expose() {
    this.checkStatus();
  }

  checkStatus() {
    this.router.get('/', (req, res) => {
      res.status(200).json({
        code: 200,
        message: 'healthy ok',
      });
    });
  }
};
