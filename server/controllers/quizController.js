const db = require("../config/db");

const createQuiz = (req, res) => {
    const { title, description, duration, total_marks } = req.body;

    if (!title || !duration || !total_marks) {
        return res.status(400).json({
            message: "All required fields are mandatory"
        });
    }

    const sql = `
        INSERT INTO quizzes
        (title, description, duration, total_marks, created_by)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            title,
            description,
            duration,
            total_marks,
            req.user.id
        ],
        (err) => {
            if (err) {
                return res.status(500).json(err);
            }

            res.status(201).json({
                message: "Quiz Created Successfully"
            });
        }
    );
};

const getAllQuizzes  = (req,res)=>{
      const sql = `
        SELECT *FROM quizzes
    `;
    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json(err);
        }
        return res.status(200).json(result);
    });

};
const getQuizById = (req, res) => {

    const { id } = req.params;

    db.query(
        "SELECT * FROM quizzes WHERE id = ?",
        [id],
        (err, result) => {

            if (err) {
                return res.status(500).json(err);
            }

            if (result.length === 0) {
                return res.status(404).json({
                    message: "Quiz Not Found"
                });
            }

            res.json(result[0]);

        }
    );
};
const updateQuiz = (req, res) => {

    const { id } = req.params;

    const {
        title,
        description,
        duration,
        total_marks,
        status
    } = req.body;

    const sql = `
        UPDATE quizzes
        SET
            title = ?,
            description = ?,
            duration = ?,
            total_marks = ?,
            status = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [
            title,
            description,
            duration,
            total_marks,
            status,
            id
        ],
        (err) => {

            if (err) {
                return res.status(500).json(err);
            }

            res.json({
                message: "Quiz Updated Successfully"
            });

        }
    );

};
const deleteQuiz = (req, res) => {

    const { id } = req.params;

    db.query(
        "DELETE FROM quizzes WHERE id = ?",
        [id],
        (err) => {

            if (err) {
                return res.status(500).json(err);
            }

            res.json({
                message: "Quiz Deleted Successfully"
            });

        }
    );

};

module.exports = {createQuiz,getAllQuizzes,getQuizById,updateQuiz,deleteQuiz};