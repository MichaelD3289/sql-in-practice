require('dotenv').config();
const {CONNECTION_STRING} = process.env;

const Sequelize = require('sequelize');
const sequelize = new Sequelize(CONNECTION_STRING, {
    dialect: 'postgress',
    dialectOptions: {
        ssl: {
            rejectUnauthorized: false
        }
    }
});

let nextEmp = 5;

module.exports = {
    getUpcomingAppointments: (req, res) => {
        sequelize.query(`select a.appt_id, a.date, a.service_type, a.approved, a.completed, u.first_name, u.last_name 
        from cc_appointments a
        join cc_emp_appts ea on a.appt_id = ea.appt_id
        join cc_employees e on e.emp_id = ea.emp_id
        join cc_users u on e.user_id = u.user_id
        where a.approved = true and a.completed = false
        order by a.date desc;`)
            .then(dbRes => res.status(200).send(dbRes[0]))
            .catch(err => console.log(err))
    },

    approveAppointment: (req, res) => {
        let {apptId} = req.body
    
        sequelize.query(`
        UPDATE cc_appointments a
        SET approved = 't'
        WHERE a.appt_id = ${apptId};
        
        INSERT INTO cc_emp_appts (emp_id, appt_id)
        VALUES (${nextEmp}, ${apptId}),
        (${nextEmp + 1}, ${apptId});
        `)
            .then(dbRes => {
                res.status(200).send(dbRes[0])
                nextEmp += 2
            })
            .catch(err => console.log(err))
    }, 
    getAllClients: (req, res) => {
        sequelize.query(`
        SELECT 
        first_name, last_name, email, phone_number, address, city, state, zip_code
        FROM cc_users u
          JOIN cc_clients c
           ON u.user_id = c.user_id;
        `)
        .then(dbRes => res.status(200).send(dbRes[0]))
        .catch(err => console.log(err));
    },
    getPendingAppointments: (req, res) => {
        sequelize.query(`
        SELECT *
        FROM cc_appointments a
        WHERE approved = 'f'
        ORDER BY date DESC;
        `)
        .then(dbRes => res.status(200).send(dbRes[0]))
        .catch(err => console.log(err));
    },
    getPastAppointments: (req, res) => {
        sequelize.query(`
        SELECT
        appt_id, date, service_type, notes, first_name, last_name, a.completed
        FROM cc_users u
            JOIN cc_clients c
                ON u.user_id = c.user_id
            JOIN cc_appointments a
                ON c.client_id = a.client_id
            WHERE approved = 't' AND completed = 't'
        ORDER BY date DESC;
        `)
        .then(dbRes => res.status(200).send(dbRes[0]))
        .catch(err => console.log(err));
    },
    completeAppointment: (req, res) => {
        const { apptId } = req.body;
        sequelize.query (`
        UPDATE cc_appointments a
        SET completed = 't'
        WHERE a.appt_id = ${apptId};
        `)
        .then(dbRes => res.status(200).send(dbRes[0]))
        .catch(err => console.log(err));
    }
}
