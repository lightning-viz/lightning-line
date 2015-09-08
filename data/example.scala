import org.viz.lightning._
import scala.util.Random

val lgn = Lightning()

val series = Array.fill(5)(Array.fill(50)(Random.nextFloat()))

lgn.line(series)
