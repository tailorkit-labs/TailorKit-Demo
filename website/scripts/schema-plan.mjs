export function isCompatiblePlan(plan) {
  if (plan?.status === "no_changes") return true;
  if (
    plan?.status !== "ok" ||
    !Array.isArray(plan.statements) ||
    !Array.isArray(plan.hints) ||
    plan.hints.length > 0
  ) {
    return false;
  }

  const newTables = new Set(
    plan.statements
      .filter((statement) => statement.type === "create_table")
      .map((statement) => JSON.stringify([statement.table.schema, statement.table.name])),
  );
  const isNewTable = (entity) =>
    entity && newTables.has(JSON.stringify([entity.schema, entity.table]));

  return plan.statements.every((statement) => {
    switch (statement.type) {
      case "create_table":
      case "create_schema":
      case "create_enum":
        return true;
      case "add_column":
        return (
          statement.column?.notNull === false &&
          !statement.isPK &&
          !statement.isCompositePK &&
          !statement.column.generated &&
          !statement.column.identity
        );
      case "create_index":
        return statement.index?.isUnique === false || isNewTable(statement.index);
      case "create_fk":
        return isNewTable(statement.fk);
      default:
        // Drops, renames, type changes, new constraints on existing tables,
        // and unknown future Drizzle operations require an explicit review.
        return false;
    }
  });
}
