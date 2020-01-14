const { Organization } = require('../../domain/entities');

module.exports = class Initiatives {
  constructor(router) {
    this.router = router;
  }

  expose() {
    this.findOrganizations();
    this.createOrganization();
  }

  findOrganizations() {
    this.router.get('/organization', async (req, res) => {
      try {
        res.status(200).json({
          data: await Organization.findAll().map((org) => {
            return {
              type: 'Organization',
              id: org.id,
              attributes: org
            }
          }),
        });
      } catch (err) {
        res.status(500).json({
          errors: [err],
        });
      }
    });
  }

  createOrganization() {
    this.router.post('/organization', async (req, res) => {
      try {
        let data = await Organization.create(req.body)

        return res.status(201).json({
          data: {
            type: 'Organization',
            id: data.id,
            attributes: data
          },
        });
      }
      catch (err) {
        res.status(500).json(err)
      }
    });
  }
};
