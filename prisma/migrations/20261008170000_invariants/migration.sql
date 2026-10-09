-- Required even when demonstration data is not seeded.
INSERT IGNORE INTO OperationLock (id) VALUES ('exchange');
ALTER TABLE `Match` ADD CONSTRAINT `Match_no_self_assignment` CHECK (`senderId` <> `recipientId`);
